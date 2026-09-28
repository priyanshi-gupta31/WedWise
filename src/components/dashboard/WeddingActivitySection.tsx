import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { NavTab } from '../layout/MobileNav';
import {
  Coins,
  Briefcase,
  Users,
  Calendar,
  CheckSquare,
  Hotel,
  Car,
  UserPlus,
  Activity,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface WeddingActivitySectionProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const WeddingActivitySection: React.FC<WeddingActivitySectionProps> = ({
  onNavigateTab,
}) => {
  const { activities, members } = useWedding();

  const latestActivities = activities.slice(0, 5);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <Coins className="w-4 h-4 text-[#E89838]" />;
      case 'vendor':
      case 'vendor_payment':
        return <Briefcase className="w-4 h-4 text-[#9E5D0A]" />;
      case 'guest':
        return <Users className="w-4 h-4 text-[#2C6E49]" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-[#641F35]" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#5A6B82]" />;
      case 'accommodation':
        return <Hotel className="w-4 h-4 text-[#7C6B7E]" />;
      case 'transport':
        return <Car className="w-4 h-4 text-[#2D5A43]" />;
      case 'member':
      case 'invitation':
        return <UserPlus className="w-4 h-4 text-[#641F35]" />;
      default:
        return <Activity className="w-4 h-4 text-[#8C7A8E]" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Resolve actor display name: if member has relationship title, use that (e.g. "Mom")
  const resolveActorTitle = (actorId: string, fallbackName: string) => {
    const mem = members.find((m) => m.user_id === actorId);
    if (mem?.relationship_title && !mem.relationship_title.includes('Owner')) {
      return mem.relationship_title.split('/')[0].trim();
    }
    return fallbackName.split(' ')[0] || 'Family';
  };

  if (latestActivities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E8DFD5] rounded-3xl p-5 sm:p-6 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#E89838] flex items-center justify-center">
            <Activity className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#16162A]">
              Wedding Activity
            </h3>
            <p className="text-[11px] text-[#7C6B7E]">
              Recent updates from family members
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('members')}
            className="text-xs font-bold text-[#641F35] hover:text-[#50182A] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity Items */}
      <div className="space-y-2.5">
        {latestActivities.map((act) => {
          const actorDisplay = resolveActorTitle(act.actor_user_id, act.actor_name);
          return (
            <div
              key={act.id}
              className="p-3 bg-[#FFFDF9] border border-[#E8DFD5]/80 hover:border-[#641F35]/30 rounded-2xl flex items-start justify-between gap-3 text-xs transition-all"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  {getEntityIcon(act.entity_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[#16162A] leading-snug">
                    <strong className="font-bold text-[#641F35]">{actorDisplay}</strong>{' '}
                    <span className="text-[#523D35]">
                      {act.action === 'created' && 'added'}
                      {act.action === 'paid' && 'paid'}
                      {act.action === 'confirmed' && 'confirmed'}
                      {act.action === 'assigned' && 'assigned'}
                      {act.action === 'updated' && 'updated'}
                      {act.action === 'deleted' && 'removed'}
                      {act.action === 'invited' && 'invited'}
                      {act.action === 'joined' && 'joined workspace'}
                      {act.action === 'role_changed' && 'updated role for'}
                      {act.action === 'ownership_transferred' && 'transferred ownership to'}{' '}
                      <span className="font-semibold text-[#16162A]">
                        {act.entity_title}
                      </span>
                    </span>
                    {act.metadata?.amount && (
                      <span className="font-bold text-[#2C6E49] ml-1">
                        · ₹{Number(act.metadata.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>

                  {act.metadata?.details && (
                    <p className="text-[11px] text-[#7C6B7E] truncate mt-0.5 italic">
                      {act.metadata.details}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-[#8C7A8E] font-medium whitespace-nowrap flex-shrink-0 pt-0.5">
                {formatTimeAgo(act.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      {onNavigateTab && (
        <button
          type="button"
          onClick={() => onNavigateTab('members')}
          className="w-full py-2 bg-[#F9F5F0] hover:bg-[#E8DFD5]/40 text-[#641F35] text-xs font-bold rounded-xl transition-colors text-center block"
        >
          View Full Wedding Log & Family Roster
        </button>
      )}
    </div>
  );
};
