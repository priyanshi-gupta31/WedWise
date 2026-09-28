import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/currency';
import { formatReadableDate } from '../../src/utils/date';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EditWeddingModal } from '../components/settings/EditWeddingModal';
import { SupabaseConfigModal } from '../components/settings/SupabaseConfigModal';
import { WeddingRingsArt } from '../components/common/WedWiseIllustrations';
import { NavTab } from '../components/layout/MobileNav';
import {
  Calendar,
  Wallet,
  Database,
  Sparkles,
  Trash2,
  LogOut,
  Edit2,
  FileCode,
  Users,
  PieChart,
  Coins,
  ChevronRight,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

interface MorePageProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const MorePage: React.FC<MorePageProps> = ({ onNavigateTab }) => {
  const { wedding, totalBudget, loadSampleData, clearSampleData } = useWedding();
  const { profile, signOut, isSupabaseActive } = useAuth();
  const { showToast } = useToast();

  const [showEditWedding, setShowEditWedding] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleLoadSample = async () => {
    try {
      await loadSampleData();
      showToast('Loaded sample wedding data! 💍', 'success');
    } catch {
      showToast('Failed to load sample data', 'error');
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearSampleData();
      showToast('All wedding details and expenses have been reset.', 'info');
      setShowClearConfirm(false);
    } catch {
      showToast('Failed to clear data', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-[#29202A]">
      {/* Editorial Header */}
      <div className="pb-2 border-b border-[#F1E4D6]">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.25em] block mb-1">
          Preferences & Workspace
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#29202A] tracking-tight">
          Wedding Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#615163] mt-1 font-serif italic">
          "Manage your celebration identity, cloud database, and demo records."
        </p>
      </div>

      {/* Wedding Profile Card */}
      {wedding && (
        <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-7 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1E4D6]">
            <div className="flex items-center gap-3">
              <WeddingRingsArt className="w-8 h-8" />
              <h3 className="text-xl font-serif font-bold text-[#29202A]">
                Wedding Identity
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowEditWedding(true)}
              className="text-xs font-semibold text-[#641F35] hover:text-[#E86A5B] flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl border border-[#F1E4D6] hover:bg-[#FFF7ED]"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#D6B36A]" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 bg-[#FFF7ED] rounded-2xl border border-[#F1E4D6]">
              <span className="text-[10px] text-[#8C7A8E] block uppercase font-bold tracking-wider mb-1">
                Wedding Title
              </span>
              <span className="font-serif font-bold text-[#29202A] text-base sm:text-lg">
                {wedding.wedding_name}
              </span>
            </div>

            <div className="p-4 bg-[#FFF7ED] rounded-2xl border border-[#F1E4D6]">
              <span className="text-[10px] text-[#8C7A8E] block uppercase font-bold tracking-wider mb-1">
                The Couple
              </span>
              <span className="font-serif font-bold text-[#641F35] text-base sm:text-lg">
                {wedding.bride_name} & {wedding.groom_name}
              </span>
            </div>

            <div className="p-4 bg-[#FFF7ED] rounded-2xl border border-[#F1E4D6]">
              <span className="text-[10px] text-[#8C7A8E] block uppercase font-bold tracking-wider mb-1">
                Celebration Date
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-[#29202A]">
                <Calendar className="w-4 h-4 text-[#E86A5B]" />
                <span className="font-serif italic text-base">{formatReadableDate(wedding.wedding_date)}</span>
              </div>
            </div>

            <div className="p-4 bg-[#FFF7ED] rounded-2xl border border-[#F1E4D6]">
              <span className="text-[10px] text-[#8C7A8E] block uppercase font-bold tracking-wider mb-1">
                Target Budget
              </span>
              <div className="flex items-center gap-1.5 font-serif font-bold text-[#29202A] text-base sm:text-lg">
                <Wallet className="w-4 h-4 text-[#D6B36A]" />
                <span>{formatINR(totalBudget)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wedding Modules Direct Shortcuts */}
      {onNavigateTab && (
        <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-7 shadow-card">
          <div className="pb-3 mb-4 border-b border-[#F1E4D6]">
            <h3 className="text-xl font-serif font-bold text-[#29202A] leading-tight">
              Wedding Planning World
            </h3>
            <p className="text-xs text-[#615163]">
              Quick navigation to dedicated wedding management experiences
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('memories')}
              className="p-4 rounded-2xl bg-gradient-to-r from-[#FFFDF9] to-[#FFF8F0] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left sm:col-span-2 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#641F35]/10 text-[#641F35] flex items-center justify-center border border-[#641F35]/20">
                  <Sparkles className="w-5 h-5 text-[#E89838]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                      Wedding Memories & Moments
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E89838]/15 text-[#852C47] border border-[#E89838]/30">
                      Archive
                    </span>
                  </div>
                  <p className="text-xs text-[#8C7A8E]">Story Archive, Ceremonial Moments & Family Memories</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('people')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF1F3] text-[#641F35] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Guest Book & Logistics
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">RSVP, Hotels & Airport Transfers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('wedding')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#9E5D0A] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Ceremonies & Timeline
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">Milestones, Schedule & Tasks</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3EC] text-[#2D5A43] flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Budget Intelligence
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">Allocations, Burn Rate & Projections</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#16162A] flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Expense Ledger
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">Receipts & Payment Tracking</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('vendors')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#9E5D0A] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Wedding Vendor Book
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">Contracts, Due Dates & Partners</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('members')}
              className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD5] hover:border-[#641F35] flex items-center justify-between group transition-all text-left sm:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF1F3] text-[#641F35] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#16162A] group-hover:text-[#641F35]">
                    Family Roster & Shared Workspace
                  </h4>
                  <p className="text-xs text-[#8C7A8E]">Roles, Invitations, Permissions & Live Activity Log</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Database / Supabase Section */}
      <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1E4D6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] flex items-center justify-center text-[#641F35]">
              <Database className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-[#29202A] leading-tight">
                Database & Privacy
              </h3>
              <p className="text-xs text-[#615163]">
                PostgreSQL cloud database & Row Level Security
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isSupabaseActive
                ? 'bg-[#E6EAE3] text-[#5D6B53] border-[#CAD4C4]'
                : 'bg-[#FAF4E6] text-[#B8944B] border-[#D6B36A]/40'
            }`}
          >
            {isSupabaseActive ? '✓ Supabase Connected' : '⚡ Local Preview Mode'}
          </span>
        </div>

        <p className="text-xs text-[#615163] leading-relaxed mb-4 font-sans">
          WedWise supports PostgreSQL cloud synchronization with private Row Level Security (RLS) policies, guaranteeing that each family's wedding records remain strictly segregated and encrypted.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#F1E4D6] hover:border-[#641F35] text-xs font-semibold text-[#29202A] flex items-center gap-2 shadow-subtle transition-all"
          >
            <Database className="w-3.5 h-3.5 text-[#D6B36A]" />
            <span>Configure Supabase Keys</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showToast('SQL Schema is ready in supabase/schema.sql', 'info');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#FFF7ED] border border-[#F1E4D6] hover:bg-white text-xs font-semibold text-[#615163] flex items-center gap-2 transition-all"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>View SQL Schema</span>
          </button>
        </div>
      </div>

      {/* Sample Data Management */}
      <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-[#F1E4D6]">
          <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] flex items-center justify-center text-[#E86A5B]">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-[#29202A] leading-tight">
              Sample Data Management
            </h3>
            <p className="text-xs text-[#615163]">
              Explore sample wedding records or start completely fresh
            </p>
          </div>
        </div>

        <p className="text-xs text-[#615163] leading-relaxed mb-4 font-sans">
          Populate Rani & Arjun's sample wedding budget (₹8,00,000) with realistic vendor disbursements, or reset existing test records.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-4 py-2.5 rounded-xl bg-[#641F35] text-[#FFF7ED] text-xs font-semibold uppercase tracking-wider shadow-wine flex items-center gap-2 hover:bg-[#52172A] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D6B36A]" />
            <span>Load Sample Wedding</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FAF1F3] border border-[#E8C5CD] text-[#641F35] hover:bg-[#F5E8EB] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Workspace</span>
          </button>
        </div>
      </div>

      {/* User Account & Sign Out */}
      <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-7 shadow-card flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#29202A]">
            Signed in as {profile?.full_name || 'Wedding Family'}
          </h4>
          <p className="text-xs text-[#615163]">{profile?.email}</p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="px-4 py-2 rounded-xl bg-[#FFF7ED] hover:bg-[#FAF1F3] border border-[#F1E4D6] text-xs font-semibold text-[#641F35] flex items-center gap-2 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Modals */}
      <EditWeddingModal
        wedding={wedding}
        isOpen={showEditWedding}
        onClose={() => setShowEditWedding(false)}
      />

      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        title="Reset Wedding Data"
        message="Are you sure you want to clear all wedding details and expenses? This will reset the workspace to a clean state."
        confirmText="Reset All"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isClearing}
      />
    </div>
  );
};
