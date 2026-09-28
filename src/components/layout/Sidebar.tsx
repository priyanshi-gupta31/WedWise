import React from 'react';
import { Home, Coins, PieChart, Calendar, Users, Briefcase, Settings, Plus, LogOut } from 'lucide-react';
import { NavTab } from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { formatReadableDate } from '../../utils/date';
import { WedWiseLogo } from '../common/WedWiseLogo';
import { WeddingRingsArt } from '../common/WedWiseIllustrations';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
}) => {
  const { profile, signOut } = useAuth();
  const { wedding } = useWedding();

  const commandNav = [
    { id: 'dashboard' as NavTab, label: 'HOME', icon: Home },
    { id: 'expenses' as NavTab, label: 'MONEY', icon: Coins },
    { id: 'budget' as NavTab, label: 'BUDGET', icon: PieChart },
    { id: 'wedding' as NavTab, label: 'WEDDING', icon: Calendar },
    { id: 'people' as NavTab, label: 'PEOPLE', icon: Users },
    { id: 'vendors' as NavTab, label: 'VENDORS', icon: Briefcase },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FFF7ED] border-r border-[#F1E4D6] min-h-screen p-6 sticky top-0 h-screen select-none justify-between overflow-y-auto">
      <div>
        {/* Brandmark */}
        <div className="mb-6">
          <WedWiseLogo size="md" showTagline={true} />
        </div>

        {/* Mini Wedding Invitation Card */}
        {wedding && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#F1E4D6] shadow-card relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#641F35] via-[#E86A5B] to-[#D6B36A]" />

            <div className="text-center pt-1">
              <span className="text-[9px] text-[#E86A5B] uppercase tracking-[0.25em] font-bold block mb-1">
                The Celebration of
              </span>
              <h3 className="text-base font-serif font-bold text-[#29202A] tracking-tight truncate">
                {wedding.bride_name} & {wedding.groom_name}
              </h3>
              <p className="text-[11px] text-[#615163] mt-0.5 font-sans">
                {formatReadableDate(wedding.wedding_date)}
              </p>
            </div>
          </div>
        )}

        {/* Signature Add Expense Floating Action */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] font-semibold text-xs uppercase tracking-wider shadow-wine hover:shadow-card transition-all duration-200 mb-6 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-[#D6B36A]" />
          <span>Record Expense</span>
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {commandNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-150 relative ${
                  isActive
                    ? 'text-[#641F35] bg-white shadow-subtle border border-[#F1E4D6]'
                    : 'text-[#615163] hover:bg-white/60 hover:text-[#29202A]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#641F35] rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#641F35]' : 'text-[#8C7A8E]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div className="pt-3 pb-2 px-3">
            <div className="h-px bg-[#F1E4D6]" />
          </div>

          {/* Settings */}
          <button
            type="button"
            onClick={() => onTabChange('more')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-150 relative ${
              activeTab === 'more'
                ? 'text-[#641F35] bg-white shadow-subtle border border-[#F1E4D6]'
                : 'text-[#615163] hover:bg-white/60 hover:text-[#29202A]'
            }`}
          >
            {activeTab === 'more' && (
              <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#641F35] rounded-r-full" />
            )}
            <Settings
              className={`w-4 h-4 transition-colors ${
                activeTab === 'more' ? 'text-[#641F35]' : 'text-[#8C7A8E]'
              }`}
            />
            <span>SETTINGS</span>
          </button>
        </nav>
      </div>

      {/* User profile & Logout footer */}
      <div className="pt-4 border-t border-[#F1E4D6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#641F35] text-[#FFF7ED] font-bold flex items-center justify-center text-xs flex-shrink-0">
              {(profile?.full_name || 'F')[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#29202A] truncate">
                {profile?.full_name || 'Wedding Family'}
              </p>
              <p className="text-[10px] text-[#8C7A8E] truncate">
                {profile?.email || 'family@wedwise.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            title="Sign Out"
            className="p-2 text-[#8C7A8E] hover:text-[#641F35] hover:bg-[#FAF1F3] rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
