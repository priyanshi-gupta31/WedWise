import React from 'react';
import { Plus, ReceiptText, PieChart, Sparkles, Calendar, Users, Briefcase, ShieldCheck } from 'lucide-react';
import { NavTab } from '../layout/MobileNav';

interface QuickActionsProps {
  onOpenAddExpense: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenAddExpense,
  onNavigateTab,
}) => {
  const actions = [
    {
      label: 'Record Expense',
      icon: Plus,
      onClick: onOpenAddExpense,
      primary: true,
      tag: 'Fast Entry',
    },
    {
      label: 'Expense Ledger',
      icon: ReceiptText,
      onClick: () => onNavigateTab('expenses'),
      primary: false,
      tag: 'Receipts',
    },
    {
      label: 'Budget Pacing',
      icon: PieChart,
      onClick: () => onNavigateTab('budget'),
      primary: false,
      tag: 'Flow',
    },
    {
      label: 'Ceremonies',
      icon: Calendar,
      onClick: () => onNavigateTab('wedding'),
      primary: false,
      tag: 'Timeline',
    },
    {
      label: 'Guest Book',
      icon: Users,
      onClick: () => onNavigateTab('people'),
      primary: false,
      tag: 'People',
    },
    {
      label: 'Vendor Book',
      icon: Briefcase,
      onClick: () => onNavigateTab('vendors'),
      primary: false,
      tag: 'Partners',
    },
    {
      label: 'Family Roster',
      icon: ShieldCheck,
      onClick: () => onNavigateTab('members'),
      primary: false,
      tag: 'Workspace',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C7A8E]">
          Quick Orchestration
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={action.onClick}
              className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all duration-200 flex items-center gap-3 active:scale-[0.98] ${
                action.primary
                  ? 'bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] border-[#641F35] shadow-wine group'
                  : 'bg-white hover:bg-[#FFF7ED] border-[#F1E4D6] text-[#29202A] shadow-subtle group'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  action.primary
                    ? 'bg-[#4A1425] text-[#D6B36A]'
                    : 'bg-[#FFF7ED] text-[#E86A5B] group-hover:bg-white'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span
                  className={`text-[9px] uppercase tracking-wider block font-bold leading-none mb-1 ${
                    action.primary ? 'text-[#D6B36A]' : 'text-[#8C7A8E]'
                  }`}
                >
                  {action.tag}
                </span>
                <span className="text-xs sm:text-sm font-semibold truncate font-sans block">
                  {action.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
