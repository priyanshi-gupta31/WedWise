import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  FAMILY_ADMIN: 'Full operational access to manage wedding finances, guest RSVPs, vendors, events, and family tasks.',
  CONTRIBUTOR: 'Operational access to create and edit expenses, guests, tasks, and vendor information.',
  VIEWER: 'Read-only access to view wedding plans, timeline, and celebrations.',
};

const ROLE_LABELS: Record<string, string> = {
  FAMILY_ADMIN: 'Family Admin',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing database credentials.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authenticate caller using their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();

    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const {
      weddingId,
      email: rawEmail,
      role: rawRole,
      displayName,
      relationshipTitle,
      message,
      resendInvitationId,
    } = body;

    if (!weddingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: weddingId.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@') || email.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid recipient email address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = String(rawRole || 'CONTRIBUTOR').toUpperCase();
    if (role === 'OWNER' || !['FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Invitations cannot grant the OWNER role.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Authorize caller via service client: must be OWNER or FAMILY_ADMIN of this wedding
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerMember } = await adminClient
      .from('wedding_members')
      .select('role, display_name, email')
      .eq('wedding_id', weddingId)
      .eq('user_id', user.id)
      .eq('status', 'Accepted')
      .maybeSingle();

    const { data: wedding } = await adminClient
      .from('weddings')
      .select('id, wedding_name, owner_id')
      .eq('id', weddingId)
      .single();

    if (!wedding) {
      return new Response(
        JSON.stringify({ error: 'Wedding workspace not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isOwner = wedding.owner_id === user.id || callerMember?.role === 'OWNER';
    const isFamilyAdmin = callerMember?.role === 'FAMILY_ADMIN';

    if (!isOwner && !isFamilyAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only the Wedding Owner or Family Admins can send invitations.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Family Admins cannot invite another Family Admin (only Owner can invite Family Admins)
    if (!isOwner && role === 'FAMILY_ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only the Wedding Owner can invite Family Admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if recipient is already an active member of this wedding
    const { data: existingMember } = await adminClient
      .from('wedding_members')
      .select('id, role')
      .eq('wedding_id', weddingId)
      .eq('email', email)
      .eq('status', 'Accepted')
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: `${email} is already an active member of this wedding workspace.` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Invalidate prior active invitations for this (wedding_id, email)
    if (resendInvitationId) {
      await adminClient
        .from('wedding_invitations')
        .update({ status: 'Revoked', updated_at: new Date().toISOString() })
        .eq('id', resendInvitationId)
        .eq('wedding_id', weddingId);
    }

    await adminClient
      .from('wedding_invitations')
      .update({ status: 'Revoked', updated_at: new Date().toISOString() })
      .eq('wedding_id', weddingId)
      .eq('email', email)
      .eq('status', 'Pending');

    // 5. Generate cryptographically secure token (48 hex characters = 192 bits of entropy)
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviterName = callerMember?.display_name || user.user_metadata?.full_name || 'Wedding Host';

    // 6. Insert new invitation into wedding_invitations
    const { data: newInvitation, error: insertErr } = await adminClient
      .from('wedding_invitations')
      .insert({
        wedding_id: weddingId,
        email,
        role,
        display_name: displayName?.trim() || null,
        relationship_title: relationshipTitle?.trim() || null,
        invited_by: user.id,
        invited_by_name: inviterName,
        message: message?.trim() || null,
        status: 'Pending',
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertErr || !newInvitation) {
      console.error('Failed to insert wedding_invitations record:', insertErr);
      return new Response(
        JSON.stringify({ error: `Database error creating invitation: ${insertErr?.message || 'unknown'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Audit log in wedding_activity
    await adminClient.from('wedding_activity').insert({
      wedding_id: weddingId,
      actor_user_id: user.id,
      actor_name: inviterName,
      actor_role: isOwner ? 'OWNER' : 'FAMILY_ADMIN',
      action: 'invited',
      entity_type: 'invitation',
      entity_id: newInvitation.id,
      entity_title: displayName?.trim() || email,
      metadata: { role, relationship: relationshipTitle, email },
    });

    // 8. Construct Invitation Email
    const siteUrl = (
      Deno.env.get('SITE_URL') ||
      req.headers.get('origin') ||
      'https://wedwise-wedding.netlify.app'
    ).replace(/\/+$/, '');

    const inviteUrl = `${siteUrl}/invite/${token}`;
    const weddingName = wedding.wedding_name || 'Our Wedding Celebration';
    const recipientDisplayName = displayName?.trim() || email.split('@')[0];
    const roleLabel = ROLE_LABELS[role] || role;
    const roleDesc = ROLE_DESCRIPTIONS[role] || '';

    const subject = `You've been invited to collaborate on a wedding in WedWise 💍`;

    const plainTextBody = `Hello ${recipientDisplayName},

You've been invited by ${inviterName} to collaborate on ${weddingName} on WedWise.

Role: ${roleLabel}
${roleDesc}

Your invitation expires in 7 days.

Accept your invitation here:
${inviteUrl}

${message ? `Personal Note from ${inviterName}:\n"${message}"\n\n` : ''}If you did not expect this invitation, you can safely ignore this email.

— The WedWise Team
`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16162A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFDF9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #E8DFD5; border-radius: 24px; padding: 36px 28px; box-shadow: 0 4px 20px rgba(100, 31, 53, 0.06);">
          <!-- Logo & Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #F0E8DF;">
              <span style="font-size: 24px; font-weight: bold; color: #641F35; letter-spacing: 0.5px;">WedWise 💍</span>
              <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #E89838; font-weight: 600;">Royal Wedding Workspace</p>
            </td>
          </tr>

          <!-- Main Invitation Message -->
          <tr>
            <td style="padding: 28px 0 20px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #16162A; line-height: 1.3; text-align: center;">
                You've been invited to join<br/><span style="color: #641F35;">${weddingName}</span>
              </h1>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #523D35; text-align: center;">
                <strong>${inviterName}</strong> has invited you to collaborate as a <strong>${roleLabel}</strong> on their wedding workspace.
              </p>

              ${message ? `
              <div style="background-color: #FFF7ED; border-left: 3px solid #E89838; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #9A5B18; font-style: italic;">
                "${message}"
              </div>` : ''}

              <!-- Role & Permissions Box -->
              <table role="presentation" width="100%" style="background-color: #FDF9F4; border: 1px solid #F0E6D8; border-radius: 16px; padding: 16px; margin: 20px 0;">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #641F35; background-color: rgba(100, 31, 53, 0.08); padding: 4px 10px; border-radius: 12px; margin-bottom: 6px;">
                      Role: ${roleLabel}
                    </span>
                    <p style="margin: 6px 0 0; font-size: 12px; line-height: 1.5; color: #7C6B7E;">
                      ${roleDesc}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #641F35; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 16px; box-shadow: 0 4px 12px rgba(100, 31, 53, 0.25);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11px; text-align: center; color: #8C7A8E;">
                ⏱️ Your invitation expires in <strong>7 days</strong>.
              </p>
            </td>
          </tr>

          <!-- Fallback URL Link -->
          <tr>
            <td style="padding-top: 20px; border-top: 1px solid #F0E8DF;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #8C7A8E; text-align: center;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 11px; color: #641F35; text-align: center; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #641F35; text-decoration: underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 9. Transactional Email Delivery via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    let emailDeliveryError: string | null = null;
    let emailMessageId: string | null = null;

    if (resendApiKey) {
      try {
        const fromEmail = Deno.env.get('EMAIL_FROM') || 'WedWise <onboarding@resend.dev>';
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject,
            html: htmlBody,
            text: plainTextBody,
          }),
        });

        if (resendResp.ok) {
          const resendData = await resendResp.json();
          emailSent = true;
          emailMessageId = resendData.id || null;
          console.log(`[send-wedding-invitation] Email delivered to ${email} via Resend. Message ID: ${emailMessageId}`);
        } else {
          const errText = await resendResp.text();
          emailDeliveryError = `Resend API HTTP ${resendResp.status}: ${errText}`;
          console.warn(`[send-wedding-invitation] Resend error:`, emailDeliveryError);
        }
      } catch (sendErr: any) {
        emailDeliveryError = `Email delivery exception: ${sendErr?.message}`;
        console.warn(`[send-wedding-invitation] Exception sending email:`, sendErr);
      }
    } else {
      console.log(`[send-wedding-invitation] RESEND_API_KEY not configured. Invitation token generated server-side for ${email}: ${inviteUrl}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: newInvitation.id,
          wedding_id: newInvitation.wedding_id,
          email: newInvitation.email,
          role: newInvitation.role,
          display_name: newInvitation.display_name,
          relationship_title: newInvitation.relationship_title,
          invited_by_name: newInvitation.invited_by_name,
          status: newInvitation.status,
          expires_at: newInvitation.expires_at,
          created_at: newInvitation.created_at,
          token: newInvitation.token,
        },
        inviteUrl,
        emailSent,
        emailMessageId,
        emailProvider: 'resend',
        missingSecret: resendApiKey ? undefined : 'RESEND_API_KEY',
        emailError: emailDeliveryError || undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-wedding-invitation] Uncaught exception:', err);
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message || 'unknown'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
