import React, { useState } from 'react';
import { MobileNav, NavTab } from '../components/layout/MobileNav';
import { TopMasthead } from '../components/layout/TopMasthead';
import { useAuth } from '../context/AuthContext';
import { Plus, Database, Sparkles } from 'lucide-react';
import { SupabaseConfigModal } from '../components/settings/SupabaseConfigModal';
import { WedWiseLogo } from '../components/common/WedWiseLogo';

interface AppLayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenAskWedWise?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAskWedWise,
  children,
}) => {
  const { isSupabaseActive } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col text-[#1B1220] selection:bg-[#E89838] selection:text-[#5A1224]">
      {/* Desktop Minimal Quiet Masthead */}
      <TopMasthead
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenConfigModal={() => setShowConfigModal(true)}
        onOpenAskWedWise={onOpenAskWedWise}
      />

      {/* Main Content Area — Full Screen Width for the Wedding World */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-16">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FFF8F0]/95 backdrop-blur-md sticky top-0 z-30 border-b border-[#F1E4D6]">
          <WedWiseLogo size="sm" showTagline={false} />

          <div className="flex items-center gap-2">
            {onOpenAskWedWise && (
              <button
                type="button"
                onClick={onOpenAskWedWise}
                className="px-2.5 py-1.5 rounded-xl border border-[#E89838]/40 bg-[#FAF4ED] text-[#5A1224] text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                title="Ask WedWise"
                aria-label="Ask WedWise"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
                <span>Ask</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="p-2 rounded-xl border border-[#F1E4D6] text-xs text-[#615163] hover:text-[#1B1220] bg-white"
              title={isSupabaseActive ? 'Supabase Connected' : 'Local Preview Mode'}
            >
              <Database className={`w-4 h-4 ${isSupabaseActive ? 'text-[#2D5A43]' : 'text-[#E89838]'}`} />
            </button>

            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 rounded-xl bg-[#5A1224] text-[#FFF7ED] text-xs font-semibold shadow-wine flex items-center gap-1 active:scale-95 transition-all"
              aria-label="Add Expense"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] text-[#E89838]" />
              <span>Record</span>
            </button>
          </div>
        </header>


        {/* Content View — Expansive & Editorial */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>

      {/* Desktop Signature Floating Action Button */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#16162A] hover:bg-[#221F38] text-[#FFF7ED] shadow-seal-3d border border-[#E89838]/40 active:scale-95 transition-all duration-150 group select-none"
          aria-label="Record Wedding Expense"
        >
          <div className="w-6 h-6 rounded-full bg-[#E89838] flex items-center justify-center text-[#16162A] group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFF7ED]">
            Record Expense
          </span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenAddExpense={onOpenAddExpense}
      />

      {/* Supabase Connection Setup Modal */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
