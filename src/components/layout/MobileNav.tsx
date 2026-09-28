import React from 'react';
import { Home, Coins, Calendar, Users, MoreHorizontal, Plus } from 'lucide-react';

export type NavTab = 'dashboard' | 'expenses' | 'budget' | 'wedding' | 'memories' | 'people' | 'vendors' | 'members' | 'more';

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#F1E4D6] px-3 py-2 shadow-modal safe-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        {/* Tab 1: HOME */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            activeTab === 'dashboard' ? 'text-[#641F35] font-bold' : 'text-[#8C7A8E] hover:text-[#29202A]'
          }`}
        >
          <Home className={`w-4.5 h-4.5 transition-transform ${activeTab === 'dashboard' ? 'text-[#641F35] scale-110' : ''}`} />
          <span className="text-[9px] uppercase tracking-wider mt-1 font-semibold">Home</span>
        </button>

        {/* Tab 2: MONEY */}
        <button
          type="button"
          onClick={() => onTabChange('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            activeTab === 'expenses' ? 'text-[#641F35] font-bold' : 'text-[#8C7A8E] hover:text-[#29202A]'
          }`}
        >
          <Coins className={`w-4.5 h-4.5 transition-transform ${activeTab === 'expenses' ? 'text-[#641F35] scale-110' : ''}`} />
          <span className="text-[9px] uppercase tracking-wider mt-1 font-semibold">Money</span>
        </button>

        {/* Center Prominent Signature Floating Add Expense Button */}
        <div className="relative -top-5 flex justify-center">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-13 h-13 rounded-full bg-[#16162A] hover:bg-[#1F1E36] text-[#FFF7ED] shadow-seal-3d flex items-center justify-center border-4 border-[#FFF8F0] active:scale-90 transition-transform duration-150 group"
            aria-label="Record Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.8] text-[#E89838] group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Tab 3: WEDDING */}
        <button
          type="button"
          onClick={() => onTabChange('wedding')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            activeTab === 'wedding' ? 'text-[#641F35] font-bold' : 'text-[#8C7A8E] hover:text-[#29202A]'
          }`}
        >
          <Calendar className={`w-4.5 h-4.5 transition-transform ${activeTab === 'wedding' ? 'text-[#641F35] scale-110' : ''}`} />
          <span className="text-[9px] uppercase tracking-wider mt-1 font-semibold">Wedding</span>
        </button>

        {/* Tab 4: MORE / SETTINGS */}
        <button
          type="button"
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            activeTab === 'more' || activeTab === 'memories' ? 'text-[#641F35] font-bold' : 'text-[#8C7A8E] hover:text-[#29202A]'
          }`}
        >
          <MoreHorizontal className={`w-4.5 h-4.5 transition-transform ${activeTab === 'more' || activeTab === 'memories' ? 'text-[#641F35] scale-110' : ''}`} />
          <span className="text-[9px] uppercase tracking-wider mt-1 font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
};
