import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WedWiseLogo } from '../components/common/WedWiseLogo';
import { WeddingHeroArt } from '../components/common/WeddingHeroArt';
import { WeddingSeal } from '../components/common/WeddingSeal';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword, enterDemoMode } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error);
          showToast(error, 'error');
        } else {
          showToast('Welcome to WedWise! 💍', 'success');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(fullName, email, password);
        if (error) {
          setErrorMsg(error);
          showToast(error, 'error');
        } else {
          showToast('Account created! Welcome to your wedding command center.', 'success');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error);
          showToast(error, 'error');
        } else {
          showToast('Password reset instructions sent to your email.', 'info');
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDemo = async () => {
    setIsLoading(true);
    try {
      await enterDemoMode();
      showToast('Stepping into Rani & Vinay’s Wedding! 💍✨', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error loading demo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col lg:flex-row text-[#1B1220] selection:bg-[#E89838] selection:text-[#5A1224] overflow-x-hidden font-sans">
      {/* ============================================================ */}
      {/* LEFT SIDE: COMMANDING DEEP BURGUNDY HERO CANVAS (Desktop 62%) */}
      {/* ============================================================ */}
      <div className="lg:w-[62%] bg-gradient-to-br from-[#5A1224] via-[#4A0E1C] to-[#2D0610] text-[#FFF7ED] relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-[580px] lg:min-h-screen">
        {/* Subtle Block-Print Jaali Geometric Wallpaper */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-mandala-texture" />

        {/* Ambient Marigold & Sindoor Lighting Orbs */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#E89838]/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-[#C93B2B]/25 blur-[120px] pointer-events-none" />

        {/* 1. TOP HEADER: Brand Monogram & The Signature Wedding Seal */}
        <div className="relative z-20 flex items-start justify-between gap-4">
          <div>
            <WedWiseLogo size="lg" showTagline={true} inverted={true} />
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#3B0A16]/80 border border-[#E89838]/40 text-[#F5C86C] text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase shadow-sm">
              <Sparkles className="w-3 h-3 text-[#E89838]" />
              <span>Private Wedding Sanctuary</span>
            </div>
          </div>

          {/* Signature Wedding Seal anchored at the top right of hero */}
          <div className="flex-shrink-0 animate-float-gentle">
            <WeddingSeal
              size="md"
              variant="burgundy"
              days="72"
              showRays={true}
              className="scale-90 sm:scale-100"
            />
          </div>
        </div>

        {/* 2. CENTER & HERO COMPOSITION: Oversized Typography + Grand Illustration */}
        <div className="relative z-20 my-auto pt-6 lg:pt-2 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Oversized Editorial Typography */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#E89838]">
              <Heart className="w-3.5 h-3.5 fill-[#C93B2B] text-[#C93B2B]" />
              <span>Every detail, in grace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#FFF7ED] tracking-tight leading-[1.04]">
              YOUR WEDDING, <br />
              <span className="italic font-normal text-[#F5C86C] font-serif">BEAUTIFULLY</span> <br />
              ORCHESTRATED.
            </h1>

            <p className="text-xs sm:text-sm text-[#FFF7ED]/85 font-sans leading-relaxed max-w-sm pt-1">
              Budgets, sacred rituals, vendor milestones, family coordination, and unforgettable moments — united in one harmonious command center.
            </p>

            {/* Couple Showcase Plaque */}
            <div className="pt-3">
              <div className="inline-block p-4 sm:p-5 rounded-3xl bg-[#3B0A16]/90 border border-[#E89838]/40 shadow-wine backdrop-blur-md">
                <span className="text-[10px] text-[#E89838] font-bold uppercase tracking-[0.25em] block leading-none mb-1.5">
                  Celebration of
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#FFF7ED] block leading-tight">
                  Rani <span className="text-[#F5C86C] font-light">&</span> Vinay
                </span>
                <div className="flex items-center gap-2 text-xs text-[#F6C6B6] mt-1.5 font-sans font-medium">
                  <span>02 · 12 · 2026</span>
                  <span>•</span>
                  <span className="text-[#F5C86C]">72 Days to Celebrate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Massive Layered Hero Illustration (2.5x Visual Presence) */}
          <div className="lg:col-span-6 flex justify-center items-center relative">
            <div className="relative w-[340px] sm:w-[420px] lg:w-[480px] xl:w-[520px] max-w-full -mb-6 lg:-mb-10 pointer-events-none">
              <WeddingHeroArt className="w-full h-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* 3. FOOTER: Editorial Brand Promise (No technical noise!) */}
        <div className="relative z-20 pt-4 border-t border-[#FFF7ED]/15 flex items-center justify-between text-[11px] text-[#F6C6B6]/80 font-medium">
          <span>WedWise Private Family Suite</span>
          <span className="font-serif italic text-[#F5C86C]">Plan Smart. Celebrate More.</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT SIDE: TACTILE WARM PAPER LOGIN EXPERIENCE (Desktop 38%) */}
      {/* ============================================================ */}
      <div className="lg:w-[38%] bg-[#FFF8F0] flex flex-col justify-center p-6 sm:p-10 lg:p-14 relative z-10 border-t lg:border-t-0 lg:border-l border-[#F1E4D6]">
        <div className="w-full max-w-md mx-auto">
          {/* Branded Editorial Header */}
          <div className="mb-8">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-[#C93B2B] block mb-2">
              Private Wedding Command
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1B1220] tracking-tight leading-none">
              {mode === 'login' && 'WELCOME BACK.'}
              {mode === 'signup' && 'BEGIN YOUR STORY.'}
              {mode === 'forgot' && 'RESET PASSWORD.'}
            </h2>
            <p className="text-sm text-[#615163] mt-2 font-sans">
              {mode === 'login' && 'Your wedding is waiting.'}
              {mode === 'signup' && 'Create your family’s private wedding workspace.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 mb-5 rounded-2xl bg-[#FAF1F3] border border-[#E8C5CD] text-[#5A1224] text-xs leading-relaxed font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#615163] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-4 py-3 text-sm bg-white border border-[#F1E4D6] rounded-2xl text-[#1B1220] focus:border-[#C93B2B] focus:ring-2 focus:ring-[#C93B2B]/20 focus:outline-none transition-all placeholder-[#8C7A8E]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#615163] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm bg-white border border-[#F1E4D6] rounded-2xl text-[#1B1220] focus:border-[#C93B2B] focus:ring-2 focus:ring-[#C93B2B]/20 focus:outline-none transition-all placeholder-[#8C7A8E]"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#615163] uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-[#C93B2B] hover:text-[#5A1224] font-semibold transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm bg-white border border-[#F1E4D6] rounded-2xl text-[#1B1220] focus:border-[#C93B2B] focus:ring-2 focus:ring-[#C93B2B]/20 focus:outline-none font-mono transition-all placeholder-[#8C7A8E]"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#615163] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm bg-white border border-[#F1E4D6] rounded-2xl text-[#1B1220] focus:border-[#C93B2B] focus:ring-2 focus:ring-[#C93B2B]/20 focus:outline-none font-mono transition-all placeholder-[#8C7A8E]"
                />
              </div>
            )}

            {/* Primary Action Button: ENTER WEDWISE → */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#5A1224] hover:bg-[#420D1A] active:scale-[0.99] text-[#FFF7ED] font-bold text-xs tracking-[0.2em] uppercase shadow-wine transition-all flex items-center justify-center gap-2 border border-[#E89838]/30 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#FFF7ED] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'ENTER WEDWISE'}
                    {mode === 'signup' && 'CREATE WORKSPACE'}
                    {mode === 'forgot' && 'SEND RECOVERY LINK'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#F5C86C] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Button */}
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleInstantDemo}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-[#F1E4D6] hover:border-[#E89838] text-xs font-semibold text-[#1B1220] flex items-center justify-center gap-2 shadow-subtle hover:shadow-card transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
                <span>Experience Demo (Rani & Vinay)</span>
              </button>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-[#F1E4D6] text-center text-xs text-[#615163]">
            {mode === 'login' && (
              <p>
                Don't have a wedding workspace?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#5A1224] hover:text-[#C93B2B] ml-1 transition-colors underline decoration-[#E89838]"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already have a workspace?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-[#5A1224] hover:text-[#C93B2B] ml-1 transition-colors underline decoration-[#E89838]"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p>
                Remembered your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-[#5A1224] hover:text-[#C93B2B] ml-1 transition-colors underline decoration-[#E89838]"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
