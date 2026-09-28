import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AskWedWiseRequest,
  AskWedWiseResponse,
  PolishStoryRequest,
  PolishStoryResponse,
} from '../types/ai';
import { aiGateway } from './aiGateway';
import { localStore } from './localStore';
import { polishStoryDeterministic } from './deterministicAssistant';

function sanitizeDisplayText(text: string): string {
  if (!text) return '';
  return text
    .replace(/:\s*undefined\b/g, ': 0')
    .replace(/•\s*Declined:\s*undefined/g, '• Declined: 0')
    .replace(/•\s*Awaiting RSVP:\s*undefined/g, '• Awaiting RSVP: 0')
    .replace(/₹\s*undefined\b/g, '₹0')
    .replace(/₹\s*NaN\b/g, '₹0')
    .replace(/undefined\s+vendors/g, '0 vendors')
    .replace(/undefined\s+guests/g, '0 guests')
    .replace(/undefined\s+tasks/g, '0 tasks')
    .replace(/undefined\s+days/g, '0 days')
    .replace(/undefined\b/g, 'Not available')
    .replace(/NaN%/g, '0%')
    .replace(/\[object Object\]/g, '');
}

/**
 * AskWedWise Client Service — Phase 8.3 & 9.7
 *
 * Frontend service responsible for dispatching queries to the secure Supabase Edge Function AI Gateway
 * when online, and falling back gracefully to the local deterministic gateway when offline.
 */
export const askWedWise = {
  /**
   * Submits a user query to the WedWise AI assistant.
   * Seamlessly bridges between the secure cloud Edge Function and the offline deterministic assistant.
   */
  async ask(
    request: AskWedWiseRequest,
    currentUserId?: string
  ): Promise<AskWedWiseResponse> {
    const trimmedQuery = (request.query || '').trim();

    // 1. If explicit Demo Mode or local workspace requested, route directly to local deterministic assistant
    const isLocalDemo =
      Boolean(currentUserId?.startsWith('local-')) ||
      Boolean(request.weddingId?.startsWith('local-')) ||
      Boolean(request.weddingId?.startsWith('wed-')) ||
      (typeof window !== 'undefined' && window.sessionStorage?.getItem('wedwise_demo_mode') === 'true');

    if (isLocalDemo) {
      const effectiveUserId = currentUserId || 'user_priya_owner';
      const localResp = await aiGateway.processRequest(
        {
          query: trimmedQuery,
          weddingId: request.weddingId,
        },
        effectiveUserId
      );
      return {
        ...localResp,
        text: sanitizeDisplayText(localResp.text),
      };
    }

    // 2. Try Cloud Edge Function if Supabase is configured and session is active
    if (isSupabaseConfigured && supabase) {
      // Check if browser is genuinely offline
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (!isOffline) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            // If authenticated but no active wedding supplied, provide clear workspace error
            if (!request.weddingId) {
              return {
                text: 'No active wedding workspace found. Please select or set up a wedding.',
                source: 'cloud',
                statusType: 'auth_error',
                toolUsed: null,
                grounding: null,
                supportedOffline: false,
                needsClarification: false,
                error: 'Forbidden: No active wedding workspace found.',
              };
            }

            const { data, error } = await supabase.functions.invoke<AskWedWiseResponse>('ask-wedwise', {
              body: {
                query: trimmedQuery,
                weddingId: request.weddingId,
              },
            });

            // Check if server returned an authorization or HTTP error
            if (error) {
              let errorMsg = error.message;
              let statusType: 'auth_error' | 'cloud_error' = 'cloud_error';
              const errorStatus = (error as any).status;

              if ((error as any).context) {
                try {
                  const errJson = await (error as any).context.json();
                  if (errJson?.text) errorMsg = errJson.text;
                  else if (errJson?.error) errorMsg = errJson.error;
                  if (errJson?.statusType) statusType = errJson.statusType;
                } catch {
                  // non-JSON context
                }
              }

              // Authoritative server authorization denial: DO NOT fall back to local gateway
              if (
                errorStatus === 403 ||
                errorStatus === 401 ||
                errorMsg?.toLowerCase().includes('forbidden') ||
                errorMsg?.toLowerCase().includes('unauthorized') ||
                errorMsg?.toLowerCase().includes('membership')
              ) {
                return {
                  text: errorMsg || 'Forbidden: You are not an active member of this wedding workspace.',
                  source: 'cloud',
                  statusType: 'auth_error',
                  toolUsed: null,
                  grounding: null,
                  supportedOffline: false,
                  needsClarification: false,
                  error: errorMsg || 'Forbidden: Workspace membership required.',
                };
              }

              // Quota / Rate limit or Cloud Service Error
              if (
                errorStatus === 429 ||
                errorMsg?.toLowerCase().includes('rate limit') ||
                errorMsg?.toLowerCase().includes('quota') ||
                errorMsg?.toLowerCase().includes('resource_exhausted')
              ) {
                return {
                  text: "The cloud AI assistant is temporarily rate-limited. You can ask directly about your wedding budget, expenses, vendors, guests, ceremonies, tasks, rooms, transport, or activity, which are powered by live wedding data.",
                  source: 'cloud',
                  statusType: 'cloud_error',
                  toolUsed: null,
                  grounding: null,
                  supportedOffline: true,
                  needsClarification: false,
                  error: 'Cloud rate limit exceeded.',
                };
              }

              console.warn('Edge Function returned non-auth error:', error);
            }

            if (data && typeof data.text === 'string') {
              return {
                ...data,
                text: sanitizeDisplayText(data.text),
                statusType: data.statusType || (data.source === 'cloud' ? 'cloud' : 'offline'),
              };
            }
          }
        } catch (err: any) {
          console.warn('Failed to contact Supabase Edge Function (offline / network error), falling back to local gateway:', err.message);
        }
      }
    }

    // 3. Local Gateway & Deterministic Fallback (Genuine Offline / LocalStore / Dev Mode)
    const effectiveUserId =
      currentUserId ||
      (localStore.getActiveWedding()?.owner_id) ||
      'user_priya_owner';

    const fallbackResp = await aiGateway.processRequest(
      {
        query: trimmedQuery,
        weddingId: request.weddingId,
      },
      effectiveUserId
    );

    return {
      ...fallbackResp,
      text: sanitizeDisplayText(fallbackResp.text),
    };
  },

  /**
   * Refines a memory story caption using WedWise Story Polisher (Phase 9.7).
   * Attempts cloud Gemini polish via Edge Function when online, with graceful deterministic fallback.
   * Never overwrites original text automatically.
   */
  async polishStory(
    request: PolishStoryRequest,
    _currentUserId?: string
  ): Promise<PolishStoryResponse> {
    const originalText = (request.story || '').trim();
    if (!originalText) {
      return {
        success: false,
        originalText: request.story,
        polishedText: request.story,
        source: 'offline',
        error: 'Cannot polish an empty story.',
      };
    }

    // 1. Try Cloud Edge Function if Supabase is configured and session is active
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const { data, error } = await supabase.functions.invoke<PolishStoryResponse>('ask-wedwise', {
            body: {
              action: 'polish_story',
              story: originalText,
              memoryTitle: request.memoryTitle,
              milestone: request.milestone,
              ceremonyName: request.ceremonyName,
              weddingId: request.weddingId,
            },
          });

          if (!error && data && data.success && typeof data.polishedText === 'string') {
            return {
              success: true,
              originalText,
              polishedText: data.polishedText,
              source: 'cloud',
            };
          }
          console.warn('Edge function story polish failed, falling back to deterministic:', error || data?.error);
        }
      } catch (err: any) {
        console.warn('Failed to contact Supabase Edge Function for story polisher:', err.message);
      }
    }

    // 2. Deterministic Fallback (Offline / Demo Mode)
    return polishStoryDeterministic(originalText, {
      memoryTitle: request.memoryTitle,
      milestone: request.milestone,
      ceremonyName: request.ceremonyName,
    });
  },
};

