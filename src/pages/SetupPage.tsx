import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR, parseCurrencyInput } from '../utils/currency';
import { IndianArchArt, WeddingRingsArt, CoupleCelebrationArt } from '../components/common/WedWiseIllustrations';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SetupPageProps {
  onComplete: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onComplete }) => {
  const { createWedding } = useWedding();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [budgetInput, setBudgetInput] = useState('2000000');
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Budget preset chips
  const budgetPresets = [
    { label: '₹10 Lakh', value: '1000000' },
    { label: '₹15 Lakh', value: '1500000' },
    { label: '₹20 Lakh', value: '2000000' },
    { label: '₹30 Lakh', value: '3000000' },
    { label: '₹50 Lakh', value: '5000000' },
  ];

  const handleNext = () => {
    if (step === 1 && (!brideName.trim() || !groomName.trim())) {
      showToast('Please enter both bride and groom names.', 'error');
      return;
    }
    if (step === 2 && !weddingDate) {
      showToast('Please pick the wedding celebration date.', 'error');
      return;
    }
    if (step === 3) {
      const b = parseCurrencyInput(budgetInput);
      if (isNaN(b) || b <= 0) {
        showToast('Please enter a valid wedding budget.', 'error');
        return;
      }
    }
    if (step < 4) {
      setStep((s) => (s + 1) as any);
    }
  };

  const handleCreateAndReveal = async () => {
    setIsLoading(true);
    try {
      const weddingTitle = `${brideName.trim()} & ${groomName.trim()}'s Wedding`;
      await createWedding({
        wedding_name: weddingTitle,
        bride_name: brideName.trim(),
        groom_name: groomName.trim(),
        wedding_date: weddingDate,
        total_budget: parseCurrencyInput(budgetInput),
      });

      setIsRevealed(true);

      // Grand celebration confetti
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#641F35', '#E86A5B', '#D6B36A', '#FFF7ED'],
        });
      } catch {
        // ignore
      }

      showToast('Your WedWise is ready! 💍✨', 'success');

      // Short delay for grand reveal impression
      setTimeout(() => {
        onComplete();
      }, 2400);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create wedding.', 'error');
      setIsLoading(false);
    }
  };

  const formattedCelebrationDate = () => {
    if (!weddingDate) return 'Select celebration date';
    try {
      const [y, m, d] = weddingDate.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return weddingDate;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden text-[#29202A]">
      {/* Decorative ambient color fields */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#641F35]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#E86A5B]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Progress Indicator */}
      <div className="relative z-10 flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? 'w-10 bg-[#641F35]'
                : i < step
                ? 'w-6 bg-[#E86A5B]'
                : 'w-6 bg-[#F1E4D6]'
            }`}
          />
        ))}
      </div>

      {/* Main Interactive Invitation Card */}
      <div className="w-full max-w-xl bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-10 shadow-card relative z-10 animate-fade-in">
        {/* Step 1: Who's Getting Married? */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF1F3] text-[#641F35] text-[11px] font-bold tracking-widest uppercase border border-[#E8C5CD]">
                <Heart className="w-3.5 h-3.5 fill-[#E86A5B] text-[#E86A5B]" />
                Step 1 of 4
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#29202A] tracking-tight">
                Who's getting married?
              </h2>
              <p className="text-xs sm:text-sm text-[#615163]">
                Enter the bride and groom's names to begin orchestrating your celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] space-y-2">
                <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider">
                  Bride
                </label>
                <input
                  type="text"
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Rani"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F1E4D6] rounded-xl text-lg font-serif font-bold text-[#29202A] focus:outline-none focus:border-[#E86A5B]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] space-y-2">
                <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider">
                  Groom
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Vinay"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F1E4D6] rounded-xl text-lg font-serif font-bold text-[#29202A] focus:outline-none focus:border-[#E86A5B]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-[#641F35] text-[#FFF7ED] font-semibold text-xs tracking-wider uppercase shadow-wine flex items-center gap-2 hover:bg-[#52172A] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-[#D6B36A]" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: When is the Celebration? */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF1F3] text-[#641F35] text-[11px] font-bold tracking-widest uppercase border border-[#E8C5CD]">
                <Sparkles className="w-3.5 h-3.5 text-[#D6B36A]" />
                Step 2 of 4
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#29202A] tracking-tight">
                When is the celebration?
              </h2>
              <p className="text-xs sm:text-sm text-[#615163]">
                {brideName} & {groomName}'s auspicious wedding date
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] text-center space-y-4">
              <input
                type="date"
                required
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full max-w-xs mx-auto px-4 py-3 bg-white border border-[#F1E4D6] rounded-xl text-center text-lg font-serif font-bold text-[#29202A] focus:outline-none focus:border-[#E86A5B]"
              />

              <div className="p-3 rounded-xl bg-white/70 border border-[#F1E4D6] inline-block">
                <span className="text-sm font-serif font-bold text-[#641F35] block">
                  {formattedCelebrationDate()}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs text-[#615163] hover:text-[#29202A] font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-[#641F35] text-[#FFF7ED] font-semibold text-xs tracking-wider uppercase shadow-wine flex items-center gap-2 hover:bg-[#52172A] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-[#D6B36A]" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: What's your wedding budget? */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF1F3] text-[#641F35] text-[11px] font-bold tracking-widest uppercase border border-[#E8C5CD]">
                <Sparkles className="w-3.5 h-3.5 text-[#D6B36A]" />
                Step 3 of 4
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#29202A] tracking-tight">
                What's your wedding budget?
              </h2>
              <p className="text-xs sm:text-sm text-[#615163]">
                Set an initial financial target. You can adjust categories anytime.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] space-y-4">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#641F35] tracking-tight block">
                  {formatINR(budgetInput || 0)}
                </span>
                <span className="text-[10px] text-[#8C7A8E] uppercase tracking-widest mt-1 block">
                  Target Wedding Capital
                </span>
              </div>

              {/* Custom Input */}
              <div className="relative max-w-xs mx-auto">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-serif font-bold text-[#8C7A8E]">
                  ₹
                </span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#F1E4D6] rounded-xl text-center font-bold text-[#29202A] focus:outline-none focus:border-[#E86A5B]"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {budgetPresets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setBudgetInput(p.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      budgetInput === p.value
                        ? 'bg-[#641F35] text-[#FFF7ED] border-[#641F35]'
                        : 'bg-white text-[#615163] border-[#F1E4D6] hover:border-[#D6B36A]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-xs text-[#615163] hover:text-[#29202A] font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-[#641F35] text-[#FFF7ED] font-semibold text-xs tracking-wider uppercase shadow-wine flex items-center gap-2 hover:bg-[#52172A] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-[#D6B36A]" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Create & Reveal */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            {!isRevealed ? (
              <>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF1F3] text-[#641F35] text-[11px] font-bold tracking-widest uppercase border border-[#E8C5CD]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D6B36A]" />
                    Final Step
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#29202A] tracking-tight">
                    Ready to create your wedding?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#615163]">
                    Review your wedding details below. We'll automatically configure your 14 expense categories.
                  </p>
                </div>

                {/* Wedding Invitation Card Preview */}
                <div className="p-6 rounded-3xl bg-[#641F35] text-[#FFF7ED] relative overflow-hidden text-center space-y-3 shadow-wine">
                  <div className="w-10 h-10 rounded-full bg-[#4A1425] border border-[#D6B36A]/40 flex items-center justify-center mx-auto mb-2">
                    <WeddingRingsArt className="w-6 h-6" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#FFF7ED]">
                    {brideName} <span className="text-[#D6B36A] font-light">&</span> {groomName}
                  </h3>

                  <p className="text-xs font-serif uppercase tracking-widest text-[#F6C6B6]">
                    {formattedCelebrationDate()}
                  </p>

                  <div className="pt-2 border-t border-white/10 text-xs text-[#D6B36A] font-semibold">
                    Budget Target: {formatINR(budgetInput)}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-xs text-[#615163] hover:text-[#29202A] font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAndReveal}
                    disabled={isLoading}
                    className="px-8 py-3.5 rounded-xl bg-[#E86A5B] hover:bg-[#D25545] text-white font-semibold text-xs tracking-wider uppercase shadow-coral flex items-center gap-2 transition-all active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Wedding Command Center</span>
                        <Sparkles className="w-4 h-4 text-[#FFF7ED]" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Grand Reveal Screen */
              <div className="py-8 space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#E6EAE3] border border-[#CAD4C4] text-[#5D6B53] flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#E86A5B] font-bold">
                    Celebration Initialized
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#641F35] tracking-tight">
                    {brideName.toUpperCase()} & {groomName.toUpperCase()}
                  </h2>
                  <p className="text-sm font-serif italic text-[#8C7A8E] tracking-widest uppercase">
                    {formattedCelebrationDate()}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] inline-block">
                  <span className="text-sm font-bold text-[#641F35] uppercase tracking-wider">
                    YOUR WEDWISE IS READY
                  </span>
                </div>

                <p className="text-xs text-[#8C7A8E]">Entering your command center...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
