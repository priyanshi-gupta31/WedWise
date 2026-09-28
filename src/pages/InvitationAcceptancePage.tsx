import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWedding } from '../context/WeddingContext';
import { useToast } from '../context/ToastContext';
import { memberService } from '../services/memberService';
import { InvitationPreview } from '../types/collaboration';
import { ROLE_CONFIGS } from '../constants/collaborationConstants';
import { WedWiseLogo } from '../components/common/WedWiseLogo';
import { Button } from '../components/common/Button';
import { formatReadableDate } from '../utils/date';
import {
  Heart,
  Sparkles,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  User,
  Mail,
  Calendar,
  LogOut,
  Users,
} from 'lucide-react';

interface InvitationAcceptancePageProps {
  token: string;
  onAccepted?: () => void;
}

export const InvitationAcceptancePage: React.FC<InvitationAcceptancePageProps> = ({
  token,
  onAccepted,
}) => {
  const { user, signIn, signUp, signOut } = useAuth();
  const { acceptInvitation, loadWeddingData } = useWedding();
  const { showToast } = useToast();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication form state (for unauthenticated users)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authFullName, setAuthFullName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Fetch invitation preview on mount
  const fetchInvitation = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('wedwise_pending_invite_token', token);
      }
      const data = await memberService.getInvitationByToken(token);
      if (!data) {
        setErrorMsg('This invitation link is invalid or no longer exists.');
      } else {
        setPreview(data);
        if (data.display_name) {
          setAuthFullName(data.display_name);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load invitation details.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  // 2. Accept Invitation Handler
  const handleAccept = async () => {
    if (!user) return;
    setIsAccepting(true);
    setErrorMsg(null);

    try {
      await acceptInvitation(token);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('wedwise_pending_invite_token');
      }
      showToast('Welcome to the wedding workspace! 💍✨', 'success');

      if (onAccepted) {
        onAccepted();
      } else {
        await loadWeddingData();
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState(null, '', '/');
        }
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setErrorMsg(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  // 3. Auth Form Submit (Sign Up or Log In and then auto-accept)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;

    setAuthError(null);
    setAuthSubmitting(true);

    try {
      const email = preview.email.trim().toLowerCase();

      if (authMode === 'signup') {
        if (!authPassword || authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters long.');
          setAuthSubmitting(false);
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError('Passwords do not match.');
          setAuthSubmitting(false);
          return;
        }

        const nameToUse = authFullName.trim() || preview.display_name || 'Family Member';
        const { error } = await signUp(nameToUse, email, authPassword);
        if (error) {
          setAuthError(error);
          setAuthSubmitting(false);
          return;
        }

        showToast('Account created! Joining workspace...', 'success');
      } else {
        const { error } = await signIn(email, authPassword);
        if (error) {
          setAuthError(error);
          setAuthSubmitting(false);
          return;
        }

        showToast('Signed in! Joining workspace...', 'success');
      }

      // After successful auth, accept invitation
      try {
        await acceptInvitation(token);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('wedwise_pending_invite_token');
        }
        showToast('Welcome to the wedding workspace! 💍✨', 'success');
        if (onAccepted) {
          onAccepted();
        } else {
          await loadWeddingData();
          window.location.href = '/';
        }
      } catch (acceptErr: any) {
        console.warn('Auto-accept error, showing accept button:', acceptErr);
        // User is now authenticated; UI will render authenticated accept view
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOutAndSwitch = async () => {
    try {
      await signOut();
      showToast('Signed out. Please sign in with the invited email.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Sign out failed', 'error');
    }
  };

  const handleReturnHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#641F35] border-t-transparent animate-spin mb-4" />
        <p className="font-serif text-[#641F35] text-lg font-bold">Verifying Wedding Invitation...</p>
        <p className="text-xs text-[#7C6B7E] mt-1">Preparing your secure workspace invitation</p>
      </div>
    );
  }

  // Error / Invalid token
  if (!preview || errorMsg) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E8DFD5] rounded-3xl p-8 shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] border border-[#C93B2B]/20 flex items-center justify-center mx-auto mb-4 text-[#C93B2B]">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#16162A] mb-2">Invitation Not Found</h1>
          <p className="text-xs sm:text-sm text-[#7C6B7E] mb-6 leading-relaxed">
            {errorMsg || 'This invitation link is invalid or may have already expired. Please request a fresh invitation from the wedding host.'}
          </p>
          <Button variant="primary" onClick={handleReturnHome} className="w-full">
            Return to WedWise
          </Button>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIGS[preview.role] || ROLE_CONFIGS.CONTRIBUTOR;
  const isExpired = preview.is_expired || preview.status === 'Expired';
  const isAccepted = preview.status === 'Accepted';
  const isRevoked = preview.status === 'Revoked';
  const isEmailMatch = user ? user.email.toLowerCase() === preview.email.toLowerCase() : false;
  const weddingTitle = preview.bride_name && preview.groom_name
    ? `${preview.bride_name} & ${preview.groom_name}'s Wedding`
    : preview.wedding_name;

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#1B1220] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#E89838] selection:text-[#5A1224]">
      {/* Top Header */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between mb-6">
        <WedWiseLogo size="md" showTagline={false} />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8DFD5] text-[#641F35] text-[10px] font-bold tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#E89838]" />
          <span>Family Invitation</span>
        </div>
      </div>

      {/* Main Invitation Card Container */}
      <div className="max-w-lg w-full mx-auto bg-white border border-[#E8DFD5] rounded-3xl shadow-card overflow-hidden my-auto">
        {/* Decorative Top Accent Banner */}
        <div className="bg-gradient-to-r from-[#641F35] via-[#7B243E] to-[#641F35] p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-mandala-texture pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#F5C86C] bg-[#3B0A16]/60 border border-[#E89838]/30 px-3 py-1 rounded-full mb-3">
              You Are Invited To Join
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {weddingTitle}
            </h1>
            {preview.wedding_date && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#FFF7ED]/90 mt-2 font-serif">
                <Calendar className="w-3.5 h-3.5 text-[#F5C86C]" />
                <span>{formatReadableDate(preview.wedding_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Inviter & Role Details */}
          <div className="bg-[#FFFDF9] border border-[#E8DFD5] rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#7C6B7E]">
                  Invited by <strong className="text-[#16162A] font-bold">{preview.invited_by_name || 'Wedding Host'}</strong>
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{roleConfig.label}</span>
                  </span>
                  {preview.relationship_title && (
                    <span className="text-xs font-serif italic text-[#641F35] bg-[#FFF5F5] px-2.5 py-1 rounded-full border border-[#641F35]/15">
                      {preview.relationship_title}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#FFF8F0] border border-[#E8DFD5] flex items-center justify-center flex-shrink-0 text-[#641F35]">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Role Permissions Summary */}
            <div className="mt-3 pt-3 border-t border-[#E8DFD5]/60">
              <p className="text-[11px] text-[#523D35] leading-relaxed">
                {roleConfig.description}
              </p>
            </div>

            {/* Personal Message (if provided) */}
            {preview.message && (
              <div className="mt-3 p-3 bg-white border border-[#E8DFD5] rounded-xl text-xs text-[#16162A] italic font-serif">
                <span className="text-[#E89838] font-bold text-base mr-1">“</span>
                {preview.message}
                <span className="text-[#E89838] font-bold text-base ml-1">”</span>
              </div>
            )}
          </div>

          {/* Invitation Email Recipient Note */}
          <div className="flex items-center gap-2 text-xs text-[#7C6B7E] px-1">
            <Mail className="w-3.5 h-3.5 text-[#641F35]" />
            <span>Invitation sent to: <strong className="text-[#16162A]">{preview.email}</strong></span>
          </div>

          {/* ======================================================= */}
          {/* CONDITIONAL ACTION SECTIONS */}
          {/* ======================================================= */}

          {/* 1. EXPIRED INVITATION */}
          {isExpired && (
            <div className="p-4 bg-[#FFF5F5] border border-[#C93B2B]/30 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-[#C93B2B]">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">Invitation Expired</h3>
                  <p className="text-xs mt-0.5 text-[#523D35]">
                    This invitation expired on{' '}
                    <strong>
                      {new Date(preview.expires_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>
                    . For security, family invitations expire after 7 days.
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#7C6B7E]">
                Please contact {preview.invited_by_name || 'the host'} to request a fresh invitation link.
              </p>
              <Button variant="secondary" onClick={handleReturnHome} className="w-full text-xs">
                Return to WedWise Home
              </Button>
            </div>
          )}

          {/* 2. REVOKED INVITATION */}
          {!isExpired && isRevoked && (
            <div className="p-4 bg-[#FFF5F5] border border-[#C93B2B]/30 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-[#C93B2B]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">Invitation Revoked</h3>
                  <p className="text-xs mt-0.5 text-[#523D35]">
                    This invitation has been cancelled by the wedding hosts.
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={handleReturnHome} className="w-full text-xs">
                Return to WedWise Home
              </Button>
            </div>
          )}

          {/* 3. ALREADY ACCEPTED */}
          {!isExpired && !isRevoked && isAccepted && (
            <div className="p-4 bg-[#EAF3EC] border border-[#A9CEB5] rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-[#2C6E49]">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">Invitation Accepted</h3>
                  <p className="text-xs mt-0.5 text-[#2D5A43]">
                    This invitation has already been accepted and activated.
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={handleReturnHome} className="w-full text-xs">
                Open Wedding Workspace
              </Button>
            </div>
          )}

          {/* 4. ACTIVE: USER LOGGED IN, EMAIL MISMATCH */}
          {!isExpired && !isRevoked && !isAccepted && user && !isEmailMatch && (
            <div className="p-4 bg-[#FFF9E6] border border-[#E89838]/40 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-[#9E5D0A]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">Account Mismatch</h3>
                  <p className="text-xs mt-1 text-[#523D35] leading-relaxed">
                    This invitation was sent to <strong className="text-[#16162A]">{preview.email}</strong>, but you are currently signed in as <strong className="text-[#16162A]">{user.email}</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={handleSignOutAndSwitch}
                  className="flex-1 text-xs py-2.5"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign Out & Switch Account
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReturnHome}
                  className="text-xs py-2.5"
                >
                  Go to My Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* 5. ACTIVE: USER LOGGED IN, EMAIL MATCHES */}
          {!isExpired && !isRevoked && !isAccepted && user && isEmailMatch && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EAF3EC] border border-[#A9CEB5] rounded-xl flex items-center gap-2 text-xs text-[#2C6E49]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Signed in as <strong>{user.email}</strong></span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#FFF5F5] border border-[#C93B2B]/30 rounded-xl text-xs text-[#C93B2B]">
                  {errorMsg}
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                {isAccepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Joining Workspace...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Accept Invitation & Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* 6. ACTIVE: USER NOT LOGGED IN */}
          {!isExpired && !isRevoked && !isAccepted && !user && (
            <div className="space-y-4 pt-2 border-t border-[#E8DFD5]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#16162A] uppercase tracking-wider">
                  {authMode === 'signup' ? 'Create Account to Accept' : 'Sign In to Accept'}
                </h3>
                <div className="flex bg-[#F9F5F0] p-0.5 rounded-lg border border-[#E8DFD5]">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      authMode === 'signup' ? 'bg-[#641F35] text-white shadow-2xs' : 'text-[#7C6B7E]'
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      authMode === 'login' ? 'bg-[#641F35] text-white shadow-2xs' : 'text-[#7C6B7E]'
                    }`}
                  >
                    Log In
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-[#FFF5F5] border border-[#C93B2B]/30 rounded-xl text-xs text-[#C93B2B] font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                {/* Email (Pre-filled from invitation) */}
                <div>
                  <label className="block text-[11px] font-bold text-[#7C6B7E] uppercase tracking-wider mb-1">
                    Invited Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7C6B7E] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={preview.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-[#F9F5F0] border border-[#E8DFD5] rounded-xl text-[#16162A] font-semibold cursor-not-allowed opacity-90"
                    />
                  </div>
                </div>

                {/* Full Name (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#7C6B7E] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                    {authMode === 'signup' ? 'Choose Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7C6B7E] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                    />
                  </div>
                </div>

                {/* Confirm Password (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7C6B7E] absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={authSubmitting}
                  className="w-full py-3 text-xs font-bold mt-2"
                >
                  {authSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{authMode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                    </span>
                  ) : (
                    <span>
                      {authMode === 'signup'
                        ? 'Create Account & Accept Invitation'
                        : 'Sign In & Accept Invitation'}
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#7C6B7E] mt-6">
        <span>WedWise • India's Premier Wedding Planning Sanctuary</span>
      </div>
    </div>
  );
};
