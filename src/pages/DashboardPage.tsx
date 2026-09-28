import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { WeddingHeroSection } from '../components/dashboard/WeddingHeroSection';
import { WeddingPulse } from '../components/dashboard/WeddingPulse';
import { BudgetSummaryCard } from '../components/dashboard/BudgetSummaryCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentExpenses } from '../components/dashboard/RecentExpenses';
import { WeddingTasksSection } from '../components/dashboard/WeddingTasksSection';
import { WeddingTimelineSection } from '../components/dashboard/WeddingTimelineSection';
import { WeddingGuestsSection } from '../components/dashboard/WeddingGuestsSection';
import { WeddingVendorsSection } from '../components/dashboard/WeddingVendorsSection';
import { WeddingActivitySection } from '../components/dashboard/WeddingActivitySection';
import { SampleDataCard } from '../components/dashboard/SampleDataCard';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';
import { Expense } from '../types/database.types';
import { NavTab } from '../components/layout/MobileNav';
import { Sparkles, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react';
import { WeddingMemory } from '../types/memories';
import { useSignedMediaUrl } from '../hooks/useSignedMediaUrl';

interface DashboardPageProps {
  onNavigateToExpenses: () => void;
  onOpenAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
  onNavigateTab?: (tab: NavTab) => void;
  onOpenAskWedWise?: () => void;
  onSelectMemory?: (memoryId: string) => void;
}

const ArchiveFilmstripCard: React.FC<{
  memory: WeddingMemory;
  onSelect: (memoryId: string) => void;
}> = ({ memory, onSelect }) => {
  const firstMedia = memory.media && memory.media.length > 0 ? memory.media[0] : null;
  const { url, isLoading } = useSignedMediaUrl(
    firstMedia?.thumbnail_path || firstMedia?.storage_path
  );

  return (
    <div
      onClick={() => onSelect(memory.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(memory.id);
        }
      }}
      className="w-72 sm:w-80 flex-shrink-0 snap-start rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#641F35] hover:shadow-card transition-all cursor-pointer text-left flex flex-col overflow-hidden group select-none focus:outline-none focus:ring-2 focus:ring-[#641F35]"
    >
      {/* Photo Frame or Editorial Story Block */}
      <div className="relative aspect-4/3 w-full bg-[#FAF4ED] overflow-hidden border-b border-[#F1E4D6]/70">
        {firstMedia ? (
          url ? (
            <img
              src={url}
              alt={memory.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8C7A8E]">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#D6B36A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-8 h-8 opacity-30 text-[#8C7A8E]" />
              )}
            </div>
          )
        ) : (
          /* Story-only heirloom moment */
          <div className="w-full h-full flex flex-col justify-center p-6 bg-gradient-to-br from-[#FFF8EE] to-[#FAF1F3]">
            <span className="font-serif italic text-2xl text-[#D6B36A]/50 select-none">“</span>
            <p className="font-serif italic text-sm text-[#29202A] line-clamp-3 leading-relaxed -mt-3">
              {memory.story_caption || memory.title}
            </p>
          </div>
        )}

        {/* Milestone Phase Badge */}
        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#641F35] border border-[#641F35]/20 shadow-2xs">
          {memory.milestone_phase}
        </span>

        {/* Photo count indicator if multiple */}
        {memory.media && memory.media.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1 shadow-2xs">
            <Camera className="w-2.5 h-2.5 text-[#E89838]" />
            <span>{memory.media.length}</span>
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#8C7A8E] mb-1 font-medium">
            <span>{memory.memory_date}</span>
            {memory.event && (
              <span className="text-[10px] text-[#641F35] font-semibold truncate max-w-[120px]">
                {memory.event.event_name}
              </span>
            )}
          </div>
          <h4 className="font-serif font-bold text-base text-[#1B1220] group-hover:text-[#641F35] line-clamp-1 transition-colors">
            {memory.title}
          </h4>
          {memory.story_caption && firstMedia && (
            <p className="mt-1 text-xs text-[#615163] font-serif italic line-clamp-2 leading-relaxed">
              "{memory.story_caption}"
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-[#F1E4D6]/60 flex items-center justify-between text-[11px] text-[#8C7A8E]">
          <span className="truncate max-w-[150px]">
            {memory.location || (memory.event ? memory.event.event_name : 'Wedding Moment')}
          </span>
          <span className="text-xs font-semibold text-[#641F35] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Explore</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToExpenses,
  onOpenAddExpense,
  onSelectExpense,
  onNavigateTab,
  onOpenAskWedWise,
  onSelectMemory,
}) => {

  const {
    wedding,
    isLoading,
    totalBudget,
    totalSpent,
    totalRemaining,
    budgetPercentageUsed,
    recentExpenses,
    memories,
    loadSampleData,
    clearSampleData,
  } = useWedding();

  const { profile } = useAuth();

  if (isLoading && !wedding) {
    return <DashboardSkeleton />;
  }

  if (!wedding) return null;

  const userName = profile?.full_name?.split(' ')[0] || 'Family';

  const handleNavigateTab = (tab: NavTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (tab === 'expenses') {
      onNavigateToExpenses();
    }
  };

  return (
    <div className="w-full animate-fade-in text-[#1B1220] selection:bg-[#E89838] selection:text-[#5A1224]">
      {/* 1. EDITORIAL WEDDING HERO SANCTUARY (Full-Bleed Centerpiece with Grand Wedding Visual) */}
      <WeddingHeroSection wedding={wedding} userName={userName} />

      {/* 1b. ASK WEDWISE ENTRY POINT (Editorial Invitation Banner) */}
      {onOpenAskWedWise && (
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 -mt-6 sm:-mt-8 mb-4 relative z-20">
          <button
            type="button"
            onClick={onOpenAskWedWise}
            className="w-full text-left bg-gradient-to-r from-[#2B1B2D] via-[#3D1422] to-[#2B1B2D] border border-[#E89838]/40 hover:border-[#E89838] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between group transition-all duration-200 active:scale-[0.99]"
            aria-label="Open Ask WedWise"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E89838]/15 border border-[#E89838]/30 flex items-center justify-center text-[#E89838] shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-serif font-bold text-[#FFF7ED] group-hover:text-[#E89838] transition-colors">
                    Ask WedWise
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-sans font-semibold px-2 py-0.5 rounded-full bg-[#E89838]/20 text-[#E89838] border border-[#E89838]/30">
                    Read-Only
                  </span>
                </div>
                <p className="text-xs text-[#F1E4D6]/80 font-sans mt-0.5">
                  Your wedding data, at a question away.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E89838] pl-3 flex-shrink-0">
              <span className="hidden sm:inline">Ask question</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* 2. RADIAL WEDDING PULSE (Freestanding Rangoli Seal Centerpiece, NOT A CARD) */}
      <WeddingPulse

        totalBudget={totalBudget}
        totalSpent={totalSpent}
        percentageUsed={budgetPercentageUsed}
        weddingDate={wedding.wedding_date}
        onNavigateTab={(tab) => handleNavigateTab(tab as any)}
      />

      {/* 3. TODAY'S ACTION PRIORITIES (Editorial Vertical Story, NOT CHECKBOX CARDS) */}
      <WeddingTasksSection onNavigateToTasks={() => handleNavigateTab('wedding')} />

      {/* 4. MONEY SNAPSHOT (Architectural Typographic Financial Spread, NO CARDS) */}
      <BudgetSummaryCard
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        totalRemaining={totalRemaining}
        percentageUsed={budgetPercentageUsed}
      />

      {/* 5. RECENT WEDDING RECEIPTS */}
      <div className="w-full py-10 px-6 sm:px-10 lg:px-16 border-t border-[#F1E4D6]/70">
        <div className="max-w-4xl mx-auto">
          <RecentExpenses
            expenses={recentExpenses}
            onViewAll={onNavigateToExpenses}
            onSelectExpense={onSelectExpense}
            onAddExpense={onOpenAddExpense}
          />
        </div>
      </div>

      {/* 5b. FROM THE WEDDING ARCHIVE (Editorial Filmstrip, Only if memories exist) */}
      {memories.length > 0 && (
        <section
          aria-label="From the Wedding Archive"
          className="w-full py-10 px-6 sm:px-10 lg:px-16 border-t border-[#F1E4D6]/70 bg-gradient-to-b from-[#FFFDF9] to-[#FFF8F0]"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#E89838] uppercase tracking-[0.2em] block mb-1">
                  Family Heirloom
                </span>
                <h3 className="font-serif font-bold text-2xl text-[#1B1220] tracking-tight">
                  From the Wedding Archive
                </h3>
                <p className="text-xs text-[#615163] font-serif italic mt-0.5">
                  "Cherished moments from {wedding.bride_name} & {wedding.groom_name}'s celebration"
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleNavigateTab('memories')}
                className="text-xs font-bold text-[#641F35] hover:text-[#852C47] flex items-center gap-1 group transition-colors flex-shrink-0"
              >
                <span>View all moments</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Horizontal Filmstrip Carousel */}
            <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
              {memories.slice(0, 4).map((memory) => (
                <ArchiveFilmstripCard
                  key={memory.id}
                  memory={memory}
                  onSelect={(id) => {
                    if (onSelectMemory) {
                      onSelectMemory(id);
                    } else {
                      handleNavigateTab('memories');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. WEDDING ENRICHMENT (Ceremonies, Guests & Partners) */}
      <div className="w-full py-12 px-6 sm:px-10 lg:px-16 border-t border-[#F1E4D6]/70 bg-[#FAF4ED]/50">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Quick Actions */}
          <QuickActions
            onOpenAddExpense={onOpenAddExpense}
            onNavigateTab={handleNavigateTab}
          />

          {/* Timeline */}
          <WeddingTimelineSection onNavigateToTimeline={() => handleNavigateTab('wedding')} />

          {/* Guests */}
          <WeddingGuestsSection onNavigateToGuests={() => handleNavigateTab('people')} />

          {/* Vendors */}
          <WeddingVendorsSection onNavigateToVendors={() => handleNavigateTab('vendors')} />

          {/* Family Collaboration & Activity Feed */}
          <WeddingActivitySection onNavigateTab={handleNavigateTab} />

          {/* Sample Demo Explorer */}
          <SampleDataCard
            hasExpenses={recentExpenses.length > 0}
            onLoadSample={loadSampleData}
            onClearSample={clearSampleData}
          />
        </div>
      </div>
    </div>
  );
};
