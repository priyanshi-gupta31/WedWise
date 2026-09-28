import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WeddingMember, WeddingInvitation, WeddingActivity } from '../types/collaboration';
import { ROLE_CONFIGS } from '../constants/collaborationConstants';
import { InviteMemberModal } from '../components/members/InviteMemberModal';
import { MemberDetailModal } from '../components/members/MemberDetailModal';
import { Button } from '../components/common/Button';
import {
  Users,
  Shield,
  Mail,
  Send,
  UserPlus,
  Clock,
  Calendar,
  Coins,
  Briefcase,
  Hotel,
  Car,
  CheckCircle2,
  XCircle,
  Activity,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const WeddingMembersPage: React.FC = () => {
  const { user } = useAuth();
  const {
    wedding,
    members,
    invitations,
    activities,
    userRole,
    can,
    revokeInvitation,
    resendInvitation,
    acceptInvitation,
  } = useWedding();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'roster' | 'invitations' | 'log'>('roster');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WeddingMember | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');

  // Counts
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'Accepted'),
    [members]
  );
  const pendingInvitations = useMemo(
    () => invitations.filter((i) => i.status === 'Pending'),
    [invitations]
  );

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (logFilter === 'all') return activities;
    if (logFilter === 'money') {
      return activities.filter((a) => a.entity_type === 'expense' || a.entity_type === 'vendor_payment');
    }
    if (logFilter === 'vendors') {
      return activities.filter((a) => a.entity_type === 'vendor' || a.entity_type === 'vendor_payment');
    }
    if (logFilter === 'guests') {
      return activities.filter((a) => a.entity_type === 'guest');
    }
    if (logFilter === 'logistics') {
      return activities.filter((a) => a.entity_type === 'accommodation' || a.entity_type === 'transport');
    }
    if (logFilter === 'events') {
      return activities.filter((a) => a.entity_type === 'event' || a.entity_type === 'task');
    }
    return activities;
  }, [activities, logFilter]);

  const handleRevokeInvitation = async (invId: string, email: string) => {
    if (!window.confirm(`Revoke the invitation sent to ${email}?`)) return;
    try {
      await revokeInvitation(invId);
      showToast(`Invitation to ${email} revoked.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke invitation.', 'error');
    }
  };

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleCopyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
        showToast('Invitation link copied to clipboard! 📋', 'success');
      } else {
        window.prompt('Copy invitation link:', inviteUrl);
      }
    } catch {
      window.prompt('Copy invitation link:', inviteUrl);
    }
  };

  const handleResendInvitation = async (invId: string, email: string) => {
    setResendingId(invId);
    try {
      const res = await resendInvitation(invId);
      if (res.emailSent) {
        showToast(`Invitation email sent to ${email}! 💌`, 'success');
      } else {
        if (res.inviteUrl && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(res.inviteUrl);
          showToast(`Fresh link generated & copied to clipboard for ${email}! 📋`, 'info');
        } else {
          showToast(`Fresh invitation link generated for ${email}.`, 'info');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invitation.', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense':
      case 'vendor_payment':
        return <Coins className="w-3.5 h-3.5 text-[#E89838]" />;
      case 'vendor':
        return <Briefcase className="w-3.5 h-3.5 text-[#9E5D0A]" />;
      case 'guest':
        return <Users className="w-3.5 h-3.5 text-[#2C6E49]" />;
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-[#641F35]" />;
      case 'accommodation':
        return <Hotel className="w-3.5 h-3.5 text-[#7C6B7E]" />;
      case 'transport':
        return <Car className="w-3.5 h-3.5 text-[#2D5A43]" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-[#8C7A8E]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* 1. HERO HEADER */}
      <div className="bg-[#FFFDF9] border border-[#E8DFD5] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-[#641F35] uppercase tracking-[0.25em]">
                Shared Wedding Workspace
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E89838]" />
              <span className="text-[11px] font-medium text-[#7C6B7E]">
                {wedding?.wedding_name || 'Wedding Celebration'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#16162A] tracking-tight">
              Family Roster & Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#523D35] mt-1 font-serif italic max-w-xl">
              "The family, coordinators, and partners keeping the royal celebration moving seamlessly."
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 mt-4 flex-wrap text-xs">
              <div className="px-3 py-1.5 bg-white border border-[#E8DFD5] rounded-xl flex items-center gap-2 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-[#2C6E49]" />
                <span className="font-bold text-[#16162A]">{activeMembers.length}</span>
                <span className="text-[#7C6B7E]">Active Family Members</span>
              </div>

              <div className="px-3 py-1.5 bg-white border border-[#E8DFD5] rounded-xl flex items-center gap-2 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#E89838]" />
                <span className="font-bold text-[#16162A]">{pendingInvitations.length}</span>
                <span className="text-[#7C6B7E]">Pending Invites</span>
              </div>

              <div className="px-3 py-1.5 bg-[#641F35]/10 border border-[#641F35]/20 rounded-xl flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#641F35]" />
                <span className="text-[11px] text-[#7C6B7E]">Your Role:</span>
                <span className="font-bold text-[#641F35]">
                  {ROLE_CONFIGS[userRole]?.label || userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action: Invite Family Member */}
          {can('INVITE_MEMBERS') && (
            <div className="flex-shrink-0">
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-[#641F35] hover:bg-[#50182A] text-white flex items-center gap-2 shadow-md w-full sm:w-auto text-xs font-bold py-3 px-5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Family Member</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E8DFD5] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-[#641F35] text-white shadow-2xs'
              : 'text-[#7C6B7E] hover:text-[#16162A] hover:bg-[#F9F5F0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Family Roster ({activeMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'invitations'
              ? 'bg-[#641F35] text-white shadow-2xs'
              : 'text-[#7C6B7E] hover:text-[#16162A] hover:bg-[#F9F5F0]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Pending Invitations ({pendingInvitations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'log'
              ? 'bg-[#641F35] text-white shadow-2xs'
              : 'text-[#7C6B7E] hover:text-[#16162A] hover:bg-[#F9F5F0]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Wedding Log ({activities.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: FAMILY ROSTER */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-fade-in">
          {activeMembers.map((member) => {
            const roleCfg = ROLE_CONFIGS[member.role] || ROLE_CONFIGS.VIEWER;
            const isSelf = user?.id === member.user_id;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white border border-[#E8DFD5] hover:border-[#641F35]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                    >
                      {roleCfg.label}
                    </span>

                    {isSelf && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#641F35]/10 text-[#641F35] px-2 py-0.5 rounded-md">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F9F5F0] border border-[#E8DFD5] flex items-center justify-center font-serif font-bold text-[#641F35] text-base group-hover:scale-105 transition-transform flex-shrink-0">
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-[#16162A] text-base leading-snug truncate group-hover:text-[#641F35] transition-colors">
                        {member.display_name}
                      </h3>
                      <p className="text-xs text-[#7C6B7E] truncate font-medium">
                        {member.relationship_title || 'Family Member'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DFD5]/60 flex items-center justify-between text-[11px] text-[#7C6B7E]">
                  <span className="truncate max-w-[170px]">{member.email}</span>
                  <span className="font-bold text-[#641F35] group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB 2: PENDING INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-3 animate-fade-in">
          {pendingInvitations.length === 0 ? (
            <div className="py-12 px-4 bg-white border border-[#E8DFD5] rounded-3xl text-center space-y-3">
              <Mail className="w-10 h-10 text-[#8C7A8E] mx-auto opacity-70" />
              <h3 className="text-base font-serif font-bold text-[#16162A]">
                No Pending Invitations
              </h3>
              <p className="text-xs text-[#7C6B7E] max-w-sm mx-auto">
                All invited family members have joined the workspace. Use "Invite Family Member" to invite more coordinators.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingInvitations.map((inv) => {
                const roleCfg = ROLE_CONFIGS[inv.role] || ROLE_CONFIGS.VIEWER;
                const isExpired = new Date(inv.expires_at).getTime() < Date.now();

                return (
                  <div
                    key={inv.id}
                    className="p-4 bg-white border border-[#E8DFD5] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                        >
                          {roleCfg.label}
                        </span>
                        {inv.relationship_title && (
                          <span className="text-[11px] font-bold text-[#641F35]">
                            {inv.relationship_title}
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] font-bold bg-[#FFF5F5] text-[#C93B2B] px-1.5 py-0.5 rounded">
                            Expired
                          </span>
                        )}
                      </div>

                      <p className="font-serif font-bold text-sm text-[#16162A]">
                        {inv.display_name ? `${inv.display_name} (${inv.email})` : inv.email}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#7C6B7E]">
                        <span>Invited by {inv.invited_by_name || 'Wedding Host'}</span>
                        <span>•</span>
                        <span>
                          Expires:{' '}
                          {new Date(inv.expires_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8DFD5]/60">
                      {/* Copy Invitation Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(inv.token)}
                        className="px-2.5 py-1.5 bg-[#FFFDF9] hover:bg-[#F9F5F0] text-[#523D35] border border-[#E8DFD5] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                        title="Copy direct invitation URL"
                      >
                        <Copy className="w-3 h-3 text-[#641F35]" />
                        <span>Copy Link</span>
                      </button>

                      {/* Resend Invitation */}
                      {can('INVITE_MEMBERS') && (
                        <button
                          type="button"
                          disabled={resendingId === inv.id}
                          onClick={() => handleResendInvitation(inv.id, inv.email)}
                          className="px-2.5 py-1.5 bg-[#FFF7ED] hover:bg-[#E89838] text-[#9E5D0A] hover:text-white border border-[#E89838]/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title="Generate fresh link and resend email"
                        >
                          <Send className="w-3 h-3" />
                          <span>{resendingId === inv.id ? 'Sending...' : 'Resend'}</span>
                        </button>
                      )}

                      {/* Revoke Invitation */}
                      {can('INVITE_MEMBERS') && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                          className="px-2.5 py-1.5 bg-[#FFF5F5] hover:bg-[#C93B2B] text-[#C93B2B] hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                          title="Revoke this invitation"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: WEDDING LOG (ACTIVITY FEED) */}
      {activeTab === 'log' && (
        <div className="space-y-4 animate-fade-in">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'money', label: 'Money & Payments' },
              { id: 'vendors', label: 'Vendors' },
              { id: 'guests', label: 'Guests' },
              { id: 'logistics', label: 'Stay & Travel' },
              { id: 'events', label: 'Ceremonies & Tasks' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLogFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  logFilter === f.id
                    ? 'bg-[#641F35] text-white font-bold shadow-2xs'
                    : 'bg-white text-[#523D35] border border-[#E8DFD5] hover:bg-[#F9F5F0]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity Stream */}
          {filteredActivities.length === 0 ? (
            <div className="py-12 px-4 bg-white border border-[#E8DFD5] rounded-3xl text-center text-xs text-[#7C6B7E]">
              No activities match this category filter.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-white border border-[#E8DFD5] rounded-2xl flex items-start justify-between gap-3 text-xs shadow-2xs hover:border-[#641F35]/30 transition-all"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#F9F5F0] border border-[#E8DFD5] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getActivityIcon(act.entity_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[#16162A] leading-relaxed">
                        <strong className="font-bold text-[#641F35]">
                          {act.actor_name}
                        </strong>{' '}
                        <span className="text-[#523D35]">
                          {act.action === 'created' && 'created'}
                          {act.action === 'paid' && 'recorded payment for'}
                          {act.action === 'confirmed' && 'confirmed'}
                          {act.action === 'assigned' && 'assigned'}
                          {act.action === 'updated' && 'updated'}
                          {act.action === 'deleted' && 'removed'}
                          {act.action === 'invited' && 'invited'}
                          {act.action === 'joined' && 'joined workspace'}
                          {act.action === 'role_changed' && 'changed role for'}
                          {act.action === 'ownership_transferred' && 'transferred ownership to'}{' '}
                          <strong className="font-bold text-[#16162A]">
                            {act.entity_title}
                          </strong>
                        </span>
                        {act.metadata?.amount && (
                          <span className="font-bold text-[#2C6E49] ml-1">
                            · ₹{Number(act.metadata.amount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </p>

                      {act.metadata?.details && (
                        <p className="text-[11px] text-[#7C6B7E] mt-0.5 italic truncate">
                          {act.metadata.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-[#8C7A8E] font-medium whitespace-nowrap pt-0.5">
                    {new Date(act.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. MODALS */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <MemberDetailModal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </div>
  );
};
