import React from 'react';
import { NavTab } from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { WedWiseLogo } from '../common/WedWiseLogo';
import { Database, Settings, LogOut, Sparkles } from 'lucide-react';

interface TopMastheadProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenConfigModal: () => void;
  onOpenAskWedWise?: () => void;
}


/**
 * TopMasthead — Ultra-quiet, minimal luxury navigation masthead.
 * Replaces the dominant SaaS sidebar so the wedding world commands 100% of the screen.
 */
export const TopMasthead: React.FC<TopMastheadProps> = ({
  activeTab,
  onTabChange,
  onOpenConfigModal,
  onOpenAskWedWise,
}) => {

  const { profile, signOut, isSupabaseActive } = useAuth();
  const { wedding } = useWedding();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'HOME' },
    { id: 'expenses' as NavTab, label: 'MONEY' },
    { id: 'budget' as NavTab, label: 'BUDGET' },
    { id: 'wedding' as NavTab, label: 'WEDDING' },
    { id: 'memories' as NavTab, label: 'MEMORIES' },
    { id: 'people' as NavTab, label: 'PEOPLE' },
    { id: 'vendors' as NavTab, label: 'VENDORS' },
    { id: 'members' as NavTab, label: 'FAMILY' },
    { id: 'more' as NavTab, label: 'MORE' },
  ];

  return (
    <header className="hidden md:flex items-center justify-between px-8 lg:px-14 py-4 bg-[#FFF8F0]/95 backdrop-blur-md border-b border-[#F1E4D6]/80 sticky top-0 z-40 select-none">
      {/* 1. Left: Refined Brand Stamp */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className="text-left focus:outline-none group"
        >
          <WedWiseLogo size="sm" showTagline={false} />
        </button>

        {wedding && (
          <span className="text-[11px] font-serif italic text-[#8C7A8E] border-l border-[#F1E4D6] pl-3">
            {wedding.bride_name} & {wedding.groom_name}
          </span>
        )}
      </div>

      {/* 2. Center: Minimal Quiet Typographic Navigation */}
      <nav className="flex items-center gap-6 lg:gap-8" aria-label="Main Editorial Navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative py-1 text-xs font-bold tracking-[0.2em] transition-all uppercase ${
                isActive
                  ? 'text-[#5A1224]'
                  : 'text-[#8C7A8E] hover:text-[#1B1220]'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#E89838] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Subtle Utilities (Ask WedWise, Supabase status, Profile, Signout) */}
      <div className="flex items-center gap-3">
        {onOpenAskWedWise && (
          <button
            type="button"
            onClick={onOpenAskWedWise}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5A1224] hover:bg-[#400B18] text-[#FFF7ED] text-xs font-semibold shadow-xs active:scale-95 transition-all"
            title="Ask WedWise"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
            <span>Ask WedWise</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenConfigModal}

          className="p-1.5 rounded-xl border border-[#F1E4D6] text-[#8C7A8E] hover:text-[#1B1220] transition-colors"
          title={isSupabaseActive ? 'Supabase Connected' : 'Local Preview Mode'}
        >
          <Database className={`w-3.5 h-3.5 ${isSupabaseActive ? 'text-[#2D5A43]' : 'text-[#E89838]'}`} />
        </button>

        <span className="text-[11px] font-medium text-[#615163]">
          {profile?.full_name?.split(' ')[0] || 'Family'}
        </span>

        <button
          type="button"
          onClick={() => signOut()}
          className="p-1.5 text-[#8C7A8E] hover:text-[#C93B2B] transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
