import React, { useState, useEffect, useRef } from 'react';
import { WeddingSeal } from '../common/WeddingSeal';
import { IndianArchArt, WeddingRingsArt } from '../common/WedWiseIllustrations';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CinematicInvitationRevealProps {
  brideName?: string;
  groomName?: string;
  weddingDate?: string;
  userName?: string;
  onFinish?: () => void;
  forceShow?: boolean;
}

/**
 * CinematicInvitationReveal — Multi-layer 3D Digital Wedding Invitation.
 *
 * Sequence:
 * 1. Dark indigo/burgundy field with floating celebratory petals.
 * 2. 3D Wedding Seal rotates slightly into position.
 * 3. Physical luxury invitation card emerges & unfolds in 3D.
 * 4. Staggered personal reveal: WEDWISE -> {brideName} & {groomName} -> {weddingDate}.
 * 5. Interactive ±3° mouse cursor parallax on desktop; gentle drift on mobile.
 * 6. Continuous Morph: The card moves toward viewer, expands, its paper surface
 *    becomes the Home hero, while the seal transforms into the Wedding Pulse.
 */
export const CinematicInvitationReveal: React.FC<CinematicInvitationRevealProps> = ({
  brideName = 'Bride',
  groomName = 'Groom',
  weddingDate = 'The Celebration Date',
  userName = 'Family',
  onFinish,
  forceShow = false,
}) => {
  // Stages: 'seal' -> 'unfold' -> 'reveal' -> 'morph' -> 'done'
  const [stage, setStage] = useState<'seal' | 'unfold' | 'reveal' | 'morph' | 'done'>('seal');
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Parallax tilt angles (degrees)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Check session storage & reduced motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsReducedMotion(true);
      }
    }

    if (!forceShow) {
      let hasSeen = false;
      try {
        hasSeen = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem('wedwise_invitation_seen'));
      } catch {
        hasSeen = false;
      }
      if (hasSeen) {
        setStage('done');
        if (onFinish) onFinish();
        return;
      }
    }

    // Sequence timeline
    const t1 = setTimeout(() => setStage('unfold'), 800);
    const t2 = setTimeout(() => setStage('reveal'), 1800);
    const t3 = setTimeout(() => setStage('morph'), 3300);
    const t4 = setTimeout(() => {
      setStage('done');
      try {
        window.sessionStorage?.setItem('wedwise_invitation_seen', 'true');
      } catch {}
      if (onFinish) onFinish();
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [forceShow, onFinish]);

  // Desktop Mouse Parallax Handler (±3 degrees max)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion || stage === 'morph' || stage === 'done') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const maxTilt = 3.0;
    const tiltX = Math.max(Math.min(-deltaY * maxTilt, maxTilt), -maxTilt);
    const tiltY = Math.max(Math.min(deltaX * maxTilt, maxTilt), -maxTilt);

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Immediate Skip handler
  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStage('done');
    try {
      window.sessionStorage?.setItem('wedwise_invitation_seen', 'true');
    } catch {}
    if (onFinish) onFinish();
  };

  if (stage === 'done') return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#12101E] overflow-hidden select-none cursor-pointer transition-all duration-1000 ${
        stage === 'morph' ? 'opacity-0 scale-125 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="WedWise 3D Digital Wedding Invitation Opening"
    >
      {/* 1. Deep Midnight Indigo / Burgundy Field */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#141124] via-[#100D1C] to-[#0A0812] pointer-events-none" />

      {/* Floating Celebratory Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[
          { top: '15%', left: '20%', size: 'w-3 h-4', color: '#E89838', dur: '7s' },
          { top: '25%', left: '80%', size: 'w-2.5 h-3.5', color: '#C93B2B', dur: '9s' },
          { top: '65%', left: '15%', size: 'w-3 h-4', color: '#F5C86C', dur: '8s' },
          { top: '75%', left: '75%', size: 'w-3.5 h-4.5', color: '#E89838', dur: '6s' },
          { top: '40%', left: '90%', size: 'w-2 h-3', color: '#C93B2B', dur: '10s' },
          { top: '85%', left: '35%', size: 'w-2.5 h-3.5', color: '#E89838', dur: '7.5s' },
        ].map((petal, i) => (
          <div
            key={i}
            className={`absolute ${petal.size} rounded-full blur-[0.5px] animate-float-gentle`}
            style={{
              top: petal.top,
              left: petal.left,
              backgroundColor: petal.color,
              animationDuration: petal.dur,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Subtle Marigold & Sindoor Center Ambient Glow */}
      <div className="absolute w-[520px] h-[520px] sm:w-[720px] sm:h-[720px] rounded-full bg-gradient-to-br from-[#E89838]/22 via-[#C93B2B]/16 to-transparent blur-[140px] pointer-events-none transform -translate-y-8" />

      {/* Subtle Traditional Geometric Jaali Watermark */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-mandala-texture" />

      {/* Subtle Top "SKIP →" Button */}
      <div className="absolute top-5 right-6 z-50">
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF7ED] text-xs font-semibold tracking-wider uppercase backdrop-blur-md border border-white/15 transition-all active:scale-95 shadow-sm"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#E89838]" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. 3D PERSPECTIVE STAGE CONTAINER                             */}
      {/* ============================================================ */}
      <div
        className="relative w-full max-w-[360px] sm:max-w-[430px] md:max-w-[470px] h-[520px] sm:h-[580px] flex items-center justify-center perspective-1200 px-4"
        style={{
          perspective: isReducedMotion ? 'none' : '1200px',
        }}
      >
        {/* ============================================================ */}
        {/* 3D FLOATING WEDDING INVITATION CARD                           */}
        {/* ============================================================ */}
        <div
          className="relative w-full h-full preserve-3d transition-transform duration-700 ease-out"
          style={{
            transform: isReducedMotion
              ? 'none'
              : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${stage === 'morph' ? '220px' : '0px'}) scale(${stage === 'morph' ? '1.8' : '1'})`,
            transition: stage === 'morph'
              ? 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-in'
              : stage === 'seal'
              ? 'transform 0.8s ease-out'
              : 'transform 0.15s ease-out',
          }}
        >
          {/* Card Physical Outer Container with Multi-Layer Depth */}
          <div
            className={`w-full h-full rounded-3xl sm:rounded-4xl p-6 sm:p-8 flex flex-col justify-between preserve-3d transition-all duration-700 relative overflow-hidden shadow-3d-card ${
              stage === 'seal'
                ? 'scale-95 bg-[#1C172E] border border-[#E89838]/30'
                : 'scale-100 bg-[#FFF8F0] border border-[#F1E4D6]'
            }`}
          >
            {/* -------------------------------------------------------- */}
            {/* LAYER 1: Card Base with Debossed Gold Foil Border        */}
            {/* -------------------------------------------------------- */}
            <div
              className={`absolute inset-3 sm:inset-4 rounded-2xl sm:rounded-3xl border pointer-events-none transition-colors duration-700 ${
                stage === 'seal' ? 'border-[#E89838]/20' : 'border-[#D6B36A]/50'
              }`}
            >
              {/* Auspicious Corner Motifs */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#E89838]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#E89838]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#E89838]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#E89838]" />
            </div>

            {/* -------------------------------------------------------- */}
            {/* LAYER 2: Decorative Indian Arch & Jaali Watermark        */}
            {/* -------------------------------------------------------- */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none preserve-3d"
              style={{ transform: isReducedMotion ? 'none' : 'translateZ(10px)' }}
            >
              <IndianArchArt className="w-80 h-96 text-[#5A1224]" />
            </div>

            {/* -------------------------------------------------------- */}
            {/* TOP HEADER: Brand Monogram & Seal Accent                */}
            {/* -------------------------------------------------------- */}
            <div
              className="relative z-20 flex flex-col items-center text-center preserve-3d transition-all duration-700"
              style={{
                transform: isReducedMotion
                  ? 'none'
                  : `translateZ(${stage === 'seal' ? '12px' : '26px'})`,
              }}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] block mb-1 transition-colors duration-500 ${
                  stage === 'seal' ? 'text-[#E89838]' : 'text-[#C93B2B]'
                }`}
              >
                Royal Wedding Invitation
              </span>

              <h1
                className={`text-2xl sm:text-3xl font-serif font-bold tracking-[0.18em] transition-colors duration-500 ${
                  stage === 'seal' ? 'text-[#FFF7ED]' : 'text-[#1B1220]'
                }`}
              >
                WEDWISE
              </h1>

              <div className="flex items-center gap-2 w-36 my-1.5 opacity-80">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E89838]" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#E89838]" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E89838]" />
              </div>

              <p
                className={`text-[10px] tracking-[0.2em] font-semibold uppercase transition-colors duration-500 ${
                  stage === 'seal' ? 'text-[#FFF7ED]/70' : 'text-[#8C7A8E]'
                }`}
              >
                Plan Smart. Celebrate More.
              </p>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CENTER STAGE: 3D Wedding Seal OR Wedding Details Reveal  */}
            {/* -------------------------------------------------------- */}
            <div className="relative z-20 my-auto flex flex-col items-center justify-center text-center preserve-3d min-h-[220px]">
              {/* STAGE 1: SEAL EMERGENCE */}
              {stage === 'seal' && (
                <div
                  className="animate-fade-in flex flex-col items-center justify-center preserve-3d"
                  style={{
                    transform: isReducedMotion ? 'none' : 'translateZ(36px) rotateZ(-4deg)',
                    transition: 'transform 0.8s ease-out',
                  }}
                >
                  <WeddingSeal
                    size="xl"
                    variant="burgundy"
                    days="72"
                    showRays={true}
                    className="shadow-seal-3d"
                  />
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#291F38] border border-[#E89838]/40 text-[#E89838] text-[10px] font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3 text-[#E89838]" />
                    <span>Unfolding Celebration</span>
                  </div>
                </div>
              )}

              {/* STAGE 2 & 3: 3D INVITATION OPENING & PERSONALIZED REVEAL */}
              {(stage === 'unfold' || stage === 'reveal' || stage === 'morph') && (
                <div
                  className="w-full flex flex-col items-center justify-center preserve-3d animate-fade-in"
                  style={{
                    transform: isReducedMotion
                      ? 'none'
                      : `translateZ(${stage === 'reveal' ? '32px' : '18px'})`,
                    transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Central Arch Rings Emblem */}
                  <div
                    className="mb-3 preserve-3d"
                    style={{ transform: isReducedMotion ? 'none' : 'translateZ(38px)' }}
                  >
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#5A1224] to-[#3B0A16] border border-[#E89838]/50 shadow-md flex items-center justify-center text-[#E89838]">
                      <WeddingRingsArt className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Auspicious Invitation Line */}
                  <span className="text-[10px] font-serif italic text-[#8C7A8E] block tracking-wider mb-1">
                    Cordially invites your presence to celebrate the union of
                  </span>

                  {/* Couple Names (Staggered Reveal) */}
                  <h2
                    className={`text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1B1220] tracking-tight leading-[1.06] transition-all duration-700 ${
                      stage === 'reveal' || stage === 'morph'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'
                    }`}
                  >
                    {brideName} <span className="text-[#E89838] font-light">&</span> {groomName}
                  </h2>

                  {/* Auspicious Date (Staggered Reveal) */}
                  <div
                    className={`mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5A1224] bg-[#FAF1F3] border border-[#E8C5CD] px-3.5 py-1.5 rounded-full transition-all duration-700 delay-100 ${
                      stage === 'reveal' || stage === 'morph'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'
                    }`}
                  >
                    <span>{weddingDate}</span>
                  </div>

                  {/* Editorial Tagline (Staggered Reveal) */}
                  <p
                    className={`text-[11px] text-[#8C7A8E] font-serif italic mt-3 tracking-wide transition-all duration-700 delay-200 ${
                      stage === 'reveal' || stage === 'morph'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'
                    }`}
                  >
                    “Your wedding, beautifully orchestrated.”
                  </p>
                </div>
              )}
            </div>

            {/* -------------------------------------------------------- */}
            {/* BOTTOM FOOTER: Family Sanctuary & Tap prompt            */}
            {/* -------------------------------------------------------- */}
            <div
              className="relative z-20 pt-3 border-t border-[#F1E4D6]/80 flex items-center justify-between text-[10px] preserve-3d"
              style={{
                transform: isReducedMotion ? 'none' : 'translateZ(20px)',
              }}
            >
              <span
                className={`font-semibold tracking-wider uppercase transition-colors duration-500 ${
                  stage === 'seal' ? 'text-[#FFF7ED]/70' : 'text-[#8C7A8E]'
                }`}
              >
                Wedding Command Center
              </span>

              <span
                className={`font-serif italic transition-colors duration-500 ${
                  stage === 'seal' ? 'text-[#E89838]' : 'text-[#5A1224]'
                }`}
              >
                Tap anywhere to enter →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
