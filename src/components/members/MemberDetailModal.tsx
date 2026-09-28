import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { WeddingMember, WeddingRole } from '../../types/collaboration';
import { ROLE_CONFIGS } from '../../constants/collaborationConstants';
import { canManageMember } from '../../utils/permissions';
import {
  User,
  Shield,
  Clock,
  Mail,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  Activity,
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: WeddingMember | null;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { user } = useAuth();
  const {
    members,
    activities,
    userRole,
    updateMemberRole,
    removeMember,
    transferOwnership,
  } = useWedding();
  const { showToast } = useToast();

  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState<WeddingRole>('CONTRIBUTOR');
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!member) return null;

  const roleConfig = ROLE_CONFIGS[member.role] || ROLE_CONFIGS.VIEWER;
  const isSelf = user?.id === member.user_id;

  // Active owners count
  const activeOwners = members.filter((m) => m.role === 'OWNER' && m.status === 'Accepted');
  const isSoleOwner = member.role === 'OWNER' && activeOwners.length <= 1;

  // Check management authority
  const manageCheck = canManageMember(
    userRole,
    user?.id || '',
    member,
    members.filter((m) => m.status === 'Accepted')
  );

  // Recent activities performed by this member
  const memberActivities = activities.filter(
    (a) => a.actor_user_id === member.user_id
  ).slice(0, 6);

  const handleUpdateRole = async () => {
    setIsProcessing(true);
    try {
      await updateMemberRole(member.id, newRole);
      showToast(`Updated ${member.display_name}'s role to ${ROLE_CONFIGS[newRole].label}! ✨`, 'success');
      setIsChangingRole(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member role.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRemove = async () => {
    setIsProcessing(true);
    try {
      await removeMember(member.id);
      showToast(`${member.display_name} has been removed from the workspace.`, 'info');
      setShowRemoveConfirm(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setIsProcessing(true);
    try {
      await transferOwnership(member.id);
      showToast(
        `Wedding ownership successfully transferred to ${member.display_name}! 👑`,
        'success'
      );
      setShowTransferConfirm(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer ownership.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member.display_name}
      subtitle={member.relationship_title || 'Family Workspace Member'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* 1. IDENTITY HEADER */}
        <div className="p-4 bg-[#F9F5F0] border border-[#E8DFD5] rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8DFD5] flex items-center justify-center text-[#641F35] font-serif font-bold text-lg shadow-2xs">
              {member.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#16162A] text-base">
                  {member.display_name}
                </h3>
                {isSelf && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#641F35]/10 text-[#641F35] px-1.5 py-0.5 rounded">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7C6B7E] flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3" />
                <span>{member.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
            >
              {roleConfig.label}
            </span>
          </div>
        </div>

        {/* 2. ROLE & PERMISSIONS BREAKDOWN */}
        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#641F35] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Role & Workspace Capabilities
            </span>
            <span className="text-[11px] text-[#7C6B7E]">
              Joined: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active'}
            </span>
          </div>

          <p className="text-xs text-[#523D35] leading-relaxed">
            {roleConfig.description}
          </p>

          <div className="pt-2 border-t border-[#E8DFD5]/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#29202A]">
            {roleConfig.permissionsSummary.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6E49] flex-shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. RECENT ACTIVITY BY THIS MEMBER */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#16162A] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#8C7A8E]" />
            Recent Activity ({memberActivities.length})
          </h4>

          {memberActivities.length === 0 ? (
            <div className="p-3 bg-[#F9F5F0] rounded-xl text-center text-xs text-[#7C6B7E]">
              No recorded actions yet by {member.display_name}.
            </div>
          ) : (
            <div className="space-y-1.5">
              {memberActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 bg-white border border-[#E8DFD5] rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#16162A] truncate">
                      {act.entity_title}
                    </p>
                    {act.metadata?.details && (
                      <p className="text-[11px] text-[#7C6B7E] truncate">
                        {act.metadata.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8C7A8E] whitespace-nowrap">
                    {new Date(act.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. MANAGEMENT CONTROLS (OWNER / ADMIN) */}
        {!isSelf && manageCheck.allowed && (
          <div className="p-3.5 bg-[#FFFDF9] border border-[#E8DFD5] rounded-2xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#16162A] block">
              Manage Member
            </span>

            {/* CHANGE ROLE (OWNER ONLY) */}
            {userRole === 'OWNER' && !isChangingRole && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-[#16162A]">Workspace Role</p>
                  <p className="text-[11px] text-[#7C6B7E]">
                    Adjust permissions for this family member
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSoleOwner}
                  onClick={() => {
                    setNewRole(member.role);
                    setIsChangingRole(true);
                  }}
                  className="text-xs"
                >
                  Change Role
                </Button>
              </div>
            )}

            {isChangingRole && (
              <div className="p-3 bg-[#F9F5F0] rounded-xl space-y-2 border border-[#E8DFD5]">
                <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as WeddingRole)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD5] rounded-xl font-medium"
                >
                  <option value="FAMILY_ADMIN">Family Admin (Operational Coordinator)</option>
                  <option value="CONTRIBUTOR">Contributor (Helper - Add & Edit)</option>
                  <option value="VIEWER">Viewer (Read-Only Access)</option>
                </select>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingRole(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isProcessing}
                    onClick={handleUpdateRole}
                    className="bg-[#641F35] text-white"
                  >
                    {isProcessing ? 'Updating...' : 'Confirm Role Change'}
                  </Button>
                </div>
              </div>
            )}

            {/* TRANSFER OWNERSHIP (OWNER ONLY) */}
            {userRole === 'OWNER' && member.role !== 'OWNER' && (
              <div className="pt-2 border-t border-[#E8DFD5]/60 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-[#16162A]">Transfer Ownership</p>
                  <p className="text-[11px] text-[#7C6B7E]">
                    Make {member.display_name} the primary wedding owner
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferConfirm(true)}
                  className="text-xs text-[#E89838] border-[#E89838]/40 hover:bg-[#FFF7ED]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                  Transfer
                </Button>
              </div>
            )}

            {/* REMOVE MEMBER */}
            <div className="pt-2 border-t border-[#E8DFD5]/60 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-[#C93B2B]">Revoke Access</p>
                <p className="text-[11px] text-[#7C6B7E]">
                  Remove {member.display_name} from workspace roster
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSoleOwner}
                onClick={() => setShowRemoveConfirm(true)}
                className="text-xs text-[#C93B2B] border-[#C93B2B]/30 hover:bg-[#FFF5F5]"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* SOLE OWNER PROTECTION BANNER */}
        {isSoleOwner && (
          <div className="p-3 bg-[#FFF7ED] border border-[#E89838]/40 rounded-xl flex items-center gap-2 text-xs text-[#9E5D0A]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This is the sole Wedding Owner. To remove or demote, ownership must first be transferred to another active member.
            </span>
          </div>
        )}

        {/* TRANSFER CONFIRMATION MODAL */}
        {showTransferConfirm && (
          <div className="p-4 bg-[#FFF7ED] border border-[#E89838] rounded-2xl space-y-2 animate-fade-in">
            <h5 className="font-serif font-bold text-sm text-[#16162A] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#E89838]" />
              Transfer Wedding Ownership?
            </h5>
            <p className="text-xs text-[#523D35] leading-relaxed">
              Are you sure you want to transfer sovereign ownership to <strong>{member.display_name}</strong>?
              You will step down to a Family Admin role.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTransferConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isProcessing}
                onClick={handleConfirmTransfer}
                className="bg-[#E89838] text-white hover:bg-[#D48226]"
              >
                {isProcessing ? 'Transferring...' : 'Yes, Transfer Ownership'}
              </Button>
            </div>
          </div>
        )}

        {/* REMOVE CONFIRMATION MODAL */}
        {showRemoveConfirm && (
          <div className="p-4 bg-[#FFF5F5] border border-[#C93B2B]/40 rounded-2xl space-y-2 animate-fade-in">
            <h5 className="font-serif font-bold text-sm text-[#C93B2B] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Remove {member.display_name} from Workspace?
            </h5>
            <p className="text-xs text-[#523D35] leading-relaxed">
              Their login access will be revoked immediately. All their recorded expenses, vendor records, and guest invitations will remain completely intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isProcessing}
                onClick={handleConfirmRemove}
              >
                {isProcessing ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        )}

        {/* CLOSE BUTTON */}
        <div className="pt-2 flex justify-end border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
