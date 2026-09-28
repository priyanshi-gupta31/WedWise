import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  WeddingMember,
  WeddingInvitation,
  InvitationPreview,
  WeddingRole,
  InviteMemberFormData,
} from '../types/collaboration';
import { localStore } from './localStore';

export const memberService = {
  async getMembers(weddingId: string): Promise<WeddingMember[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_members')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data as WeddingMember[];
        }
      } catch (err) {
        console.warn('Supabase fetch members failed, falling back to local storage:', err);
      }
    }
    return localStore.getMembers(weddingId);
  },

  async getMember(weddingId: string, userId: string): Promise<WeddingMember | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_members')
          .select('*')
          .eq('wedding_id', weddingId)
          .eq('user_id', userId)
          .eq('status', 'Accepted')
          .maybeSingle();

        if (!error && data) {
          return data as WeddingMember;
        }
      } catch (err) {
        console.warn('Supabase fetch member failed, falling back to local storage:', err);
      }
    }
    return localStore.getMember(weddingId, userId);
  },

  async updateMemberRole(
    weddingId: string,
    memberId: string,
    newRole: WeddingRole,
    actorUserId?: string
  ): Promise<{ success: boolean; member?: WeddingMember; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_members')
          .update({
            role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memberId)
          .eq('wedding_id', weddingId)
          .select()
          .single();

        if (!error && data) {
          return { success: true, member: data as WeddingMember };
        }
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase update member role failed, falling back to local:', err);
        return { success: false, error: err.message || 'Failed to update member role.' };
      }
    }
    return localStore.updateMemberRole(weddingId, memberId, newRole, actorUserId);
  },

  async removeMember(
    weddingId: string,
    memberId: string,
    actorUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('wedding_members')
          .delete()
          .eq('id', memberId)
          .eq('wedding_id', weddingId);

        if (!error) {
          return { success: true };
        }
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('Supabase remove member failed, falling back to local:', err);
        return { success: false, error: err.message || 'Failed to remove member.' };
      }
    }
    return localStore.removeMember(weddingId, memberId, actorUserId);
  },

  async transferOwnership(
    weddingId: string,
    targetMemberId: string,
    currentOwnerUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Both Supabase RPC or local fallback
    return localStore.transferOwnership(weddingId, targetMemberId, currentOwnerUserId);
  },

  async getInvitations(weddingId: string): Promise<WeddingInvitation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_invitations')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as WeddingInvitation[];
        }
      } catch (err) {
        console.warn('Supabase fetch invitations failed, falling back to local storage:', err);
      }
    }
    return localStore.getInvitations(weddingId);
  },

  async getInvitationByToken(token: string): Promise<InvitationPreview | null> {
    if (!token || !token.trim()) return null;
    const cleanToken = token.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_invitation_by_token', {
          p_token: cleanToken,
        });

        if (!error && data) {
          return data as InvitationPreview;
        }
        if (error) {
          console.warn('Supabase get_invitation_by_token error:', error.message);
        }
      } catch (err) {
        console.warn('Failed to fetch invitation by token from Supabase:', err);
      }
    }

    // LocalStore fallback
    const localInv = localStore.getInvitationByToken ? localStore.getInvitationByToken(cleanToken) : null;
    if (localInv) {
      const activeWed = localStore.getActiveWedding();
      const isExpired = new Date(localInv.expires_at).getTime() < Date.now();
      return {
        id: localInv.id,
        wedding_id: localInv.wedding_id,
        wedding_name: activeWed?.wedding_name || 'Wedding Celebration',
        email: localInv.email,
        role: localInv.role,
        display_name: localInv.display_name,
        relationship_title: localInv.relationship_title,
        invited_by_name: localInv.invited_by_name,
        status: isExpired && localInv.status === 'Pending' ? 'Expired' : localInv.status,
        expires_at: localInv.expires_at,
        is_expired: isExpired,
        created_at: localInv.created_at,
      };
    }

    return null;
  },

  async createInvitation(
    weddingId: string,
    inviterUserId: string,
    inviterName: string,
    inviterRole: WeddingRole,
    data: InviteMemberFormData
  ): Promise<{ invitation?: WeddingInvitation; inviteUrl?: string; emailSent?: boolean; missingSecret?: string; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: respData, error: fnError } = await supabase.functions.invoke('send-wedding-invitation', {
          body: {
            weddingId,
            email: data.email.trim().toLowerCase(),
            role: data.role,
            displayName: data.display_name?.trim() || undefined,
            relationshipTitle: data.relationship_title || undefined,
            message: data.message?.trim() || undefined,
          },
        });

        if (fnError) {
          let errMsg = fnError.message;
          if ((fnError as any).context) {
            try {
              const errJson = await (fnError as any).context.json();
              if (errJson?.error) errMsg = errJson.error;
            } catch {
              // ignore
            }
          }
          return { error: errMsg || 'Failed to send invitation.' };
        }

        if (respData?.invitation) {
          return {
            invitation: respData.invitation as WeddingInvitation,
            inviteUrl: respData.inviteUrl,
            emailSent: respData.emailSent ?? false,
            missingSecret: respData.missingSecret,
          };
        }
      } catch (err: any) {
        console.warn('Supabase send-wedding-invitation invoke failed, falling back to local:', err);
      }
    }
    return localStore.createInvitation(weddingId, inviterUserId, inviterName, inviterRole, data);
  },

  async resendInvitation(
    weddingId: string,
    invitationId: string,
    email: string,
    role: WeddingRole,
    displayName?: string,
    relationshipTitle?: string
  ): Promise<{ success: boolean; invitation?: WeddingInvitation; inviteUrl?: string; emailSent?: boolean; missingSecret?: string; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: respData, error: fnError } = await supabase.functions.invoke('send-wedding-invitation', {
          body: {
            weddingId,
            email: email.trim().toLowerCase(),
            role,
            displayName,
            relationshipTitle,
            resendInvitationId: invitationId,
          },
        });

        if (fnError) {
          let errMsg = fnError.message;
          if ((fnError as any).context) {
            try {
              const errJson = await (fnError as any).context.json();
              if (errJson?.error) errMsg = errJson.error;
            } catch {
              // ignore
            }
          }
          return { success: false, error: errMsg || 'Failed to resend invitation.' };
        }

        if (respData?.invitation) {
          return {
            success: true,
            invitation: respData.invitation as WeddingInvitation,
            inviteUrl: respData.inviteUrl,
            emailSent: respData.emailSent ?? false,
            missingSecret: respData.missingSecret,
          };
        }
      } catch (err: any) {
        console.warn('Supabase resend invitation failed:', err);
        return { success: false, error: err.message || 'Failed to resend invitation.' };
      }
    }
    return { success: false, error: 'Offline mode: cannot send email invitations.' };
  },

  async acceptInvitation(
    token: string,
    userId?: string,
    userEmail?: string,
    displayName?: string
  ): Promise<{ success: boolean; member?: WeddingMember; weddingId?: string; role?: WeddingRole; error?: string }> {
    if (!token || !token.trim()) {
      return { success: false, error: 'Invalid invitation token.' };
    }
    const cleanToken = token.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('accept_wedding_invitation', {
          p_token: cleanToken,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data && data.success) {
          return {
            success: true,
            weddingId: data.wedding_id,
            role: data.role,
          };
        }
      } catch (err: any) {
        console.warn('Supabase accept_wedding_invitation failed:', err);
        return { success: false, error: err.message || 'Failed to accept invitation.' };
      }
    }

    if (userId && userEmail && displayName) {
      return localStore.acceptInvitation(cleanToken, userId, userEmail, displayName);
    }
    return { success: false, error: 'Cannot accept invitation without user credentials.' };
  },

  async revokeInvitation(
    invitationId: string,
    actorUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('wedding_invitations')
          .update({
            status: 'Revoked',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        if (!error) return { success: true };
        return { success: false, error: error.message };
      } catch (err: any) {
        console.warn('Supabase revoke invitation failed:', err);
      }
    }
    return localStore.revokeInvitation(invitationId, actorUserId);
  },
};
