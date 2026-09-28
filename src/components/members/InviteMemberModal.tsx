import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { WeddingRole, InviteMemberFormData } from '../../types/collaboration';
import {
  ROLE_CONFIGS,
  RELATIONSHIP_PRESETS,
  INVITATION_EXPIRY_DAYS,
} from '../../constants/collaborationConstants';
import { canInviteRole } from '../../utils/permissions';
import { Mail, User, Heart, Shield, Clock, Send } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const { inviteMember, userRole } = useWedding();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationshipTitle, setRelationshipTitle] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [role, setRole] = useState<WeddingRole>('CONTRIBUTOR');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter allowed roles based on actor's role
  const allowedRoles: WeddingRole[] = (
    ['FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER'] as WeddingRole[]
  ).filter((r) => canInviteRole(userRole, r));

  const effectiveRelationship =
    relationshipTitle === 'Other' ? customRelationship.trim() : relationshipTitle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: InviteMemberFormData = {
        email: emailTrimmed,
        role,
        display_name: displayName.trim() || undefined,
        relationship_title: effectiveRelationship || undefined,
        message: message.trim() || undefined,
      };

      await inviteMember(payload);
      showToast(
        `Sent workspace invitation to ${displayName.trim() || emailTrimmed} as ${ROLE_CONFIGS[role].label}! 💌`,
        'success'
      );
      // Reset form
      setEmail('');
      setDisplayName('');
      setRelationshipTitle('');
      setCustomRelationship('');
      setMessage('');
      onClose();
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      setError(err.message || 'Could not send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite to Family Workspace"
      subtitle="Grant family members secure access to wedding planning on their phones."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FFF5F5] border border-[#C93B2B]/30 rounded-xl text-xs text-[#C93B2B] font-medium">
            {error}
          </div>
        )}

        {/* 1. EMAIL ADDRESS */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Email Address <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sunita.sharma@example.com"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
            />
          </div>
        </div>

        {/* 2. DISPLAY NAME */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Display Name
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sunita Sharma"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
            />
          </div>
        </div>

        {/* 3. RELATIONSHIP / FAMILY TITLE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1.5">
            Family Role / Relationship
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {RELATIONSHIP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRelationshipTitle(preset)}
                className={`px-2.5 py-1 text-xs rounded-xl font-medium border transition-all ${
                  relationshipTitle === preset
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#523D35] border-[#E8DFD5] hover:bg-[#F9F5F0]'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRelationshipTitle('Other')}
              className={`px-2.5 py-1 text-xs rounded-xl font-medium border transition-all ${
                relationshipTitle === 'Other'
                  ? 'bg-[#641F35] text-white border-[#641F35]'
                  : 'bg-white text-[#523D35] border-[#E8DFD5] hover:bg-[#F9F5F0]'
              }`}
            >
              Other
            </button>
          </div>

          {relationshipTitle === 'Other' && (
            <input
              type="text"
              value={customRelationship}
              onChange={(e) => setCustomRelationship(e.target.value)}
              placeholder="e.g. Maasi Ji, Groomsman, Lead Coordinator"
              className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
            />
          )}
        </div>

        {/* 4. WORKSPACE ROLE SELECTION */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1.5">
            Workspace Permission Level <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {allowedRoles.map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const isSelected = role === r;
              return (
                <div
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F9F5F0] border-[#641F35] ring-1 ring-[#641F35]'
                      : 'bg-white border-[#E8DFD5] hover:border-[#641F35]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#16162A]">{cfg.label}</span>
                    <Shield
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-[#641F35]' : 'text-[#8C7A8E]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[#7C6B7E] leading-relaxed">
                    {cfg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. OPTIONAL MESSAGE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Personal Note (Optional)
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Please help coordinate the Sangeet playlist and hotel stays!"
            className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
          />
        </div>

        {/* INVITATION SECURITY NOTICE */}
        <div className="p-3 bg-[#F9F5F0] border border-[#E8DFD5] rounded-2xl flex items-center gap-2 text-xs text-[#7C6B7E]">
          <Clock className="w-4 h-4 text-[#8C7A8E] flex-shrink-0" />
          <span>
            Invitations expire automatically in {INVITATION_EXPIRY_DAYS} days. The member must accept before workspace access is granted.
          </span>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="bg-[#641F35] hover:bg-[#50182A] text-white flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
