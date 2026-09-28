import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Users, UserCheck, Clock, UserX, Heart, ChevronRight, Hotel, Car } from 'lucide-react';

interface WeddingGuestsSectionProps {
  onNavigateToGuests?: () => void;
}

export const WeddingGuestsSection: React.FC<WeddingGuestsSectionProps> = ({
  onNavigateToGuests,
}) => {
  const { guestMetrics, sideSummaries, accommodations, transports } = useWedding();

  const totalHeadcount = guestMetrics.totalInvitedHeadcount;
  const confirmedHeadcount = guestMetrics.confirmedHeadcount;
  const awaitingHeadcount = guestMetrics.awaitingHeadcount;
  const declinedHeadcount = guestMetrics.declinedHeadcount;

  const attendanceRate = totalHeadcount > 0 ? Math.round((confirmedHeadcount / totalHeadcount) * 100) : 0;

  // Format side summary text
  const brideSummary = sideSummaries.find((s) => s.side === 'Bride');
  const groomSummary = sideSummaries.find((s) => s.side === 'Groom');
  const sideDetails = [
    brideSummary ? `Bride's Side (${brideSummary.totalHeadcount})` : null,
    groomSummary ? `Groom's Side (${groomSummary.totalHeadcount})` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden transition-all hover:border-[#E89838]/40">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F1E4D6]">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.25em] block mb-1">
            Family & Attendees
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#29202A] tracking-tight">
            The Wedding Guests
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {totalHeadcount > 0 && (
            <span className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full bg-[#E6EAE3] text-[#5D6B53]">
              {attendanceRate}% Confirmed
            </span>
          )}

          {onNavigateToGuests && (
            <button
              onClick={onNavigateToGuests}
              className="flex items-center gap-1 text-xs font-serif font-bold text-[#641F35] hover:text-[#E86A5B] transition-colors"
            >
              <span>Guest Book</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Grouping with Large Dynamic Headcount Typography */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {/* Total Guests Headcount */}
        <div
          onClick={onNavigateToGuests}
          className={`p-5 rounded-2xl bg-[#641F35] text-[#FFF7ED] shadow-wine ${
            onNavigateToGuests ? 'cursor-pointer hover:bg-[#54192C] transition-colors' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6B36A]">
              Total Headcount
            </span>
            <Users className="w-4 h-4 text-[#D6B36A]" />
          </div>
          <span className="text-3xl sm:text-4xl font-serif font-bold block">{totalHeadcount}</span>
          <span className="text-[11px] text-[#F6C6B6] block mt-1">
            {guestMetrics.totalParties} {guestMetrics.totalParties === 1 ? 'party' : 'parties'} invited
          </span>
        </div>

        {/* Confirmed Attending */}
        <div
          onClick={onNavigateToGuests}
          className={`p-5 rounded-2xl bg-[#E6EAE3] border border-[#CAD4C4] text-[#5D6B53] ${
            onNavigateToGuests ? 'cursor-pointer hover:bg-[#DEE3DA] transition-colors' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="text-3xl sm:text-4xl font-serif font-bold block text-[#29202A]">
            {confirmedHeadcount}
          </span>
          <span className="text-[11px] text-[#5D6B53] block mt-1">Attending ceremonies</span>
        </div>

        {/* Awaiting RSVP */}
        <div
          onClick={onNavigateToGuests}
          className={`p-5 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] ${
            onNavigateToGuests ? 'cursor-pointer hover:bg-amber-50/70 transition-colors' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E86A5B]">
              Awaiting RSVP
            </span>
            <Clock className="w-4 h-4 text-[#E86A5B]" />
          </div>
          <span className="text-3xl sm:text-4xl font-serif font-bold block text-[#29202A]">
            {awaitingHeadcount}
          </span>
          <span className="text-[11px] text-[#8C7A8E] block mt-1">
            {guestMetrics.awaitingParties} responses pending
          </span>
        </div>

        {/* Declined */}
        <div
          onClick={onNavigateToGuests}
          className={`p-5 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] ${
            onNavigateToGuests ? 'cursor-pointer hover:bg-amber-50/70 transition-colors' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E]">
              Declined
            </span>
            <UserX className="w-4 h-4 text-[#8C7A8E]" />
          </div>
          <span className="text-3xl sm:text-4xl font-serif font-bold block text-[#8C7A8E]">
            {declinedHeadcount}
          </span>
          <span className="text-[11px] text-[#8C7A8E] block mt-1">Regrets received</span>
        </div>
      </div>

      {/* Logistics & Family Side Strip */}
      <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#E86A5B] shrink-0" />
          <span className="font-semibold text-[#29202A]">Side Breakdown:</span>
          <span className="text-[#615163]">
            {sideDetails || 'No sides registered yet'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-[#641F35]">
          <span className="flex items-center gap-1">
            <Hotel className="w-3.5 h-3.5 text-[#E89838]" />
            <span>{accommodations.length} Rooms Allotted</span>
          </span>
          <span className="flex items-center gap-1 text-[#2D5A43]">
            <Car className="w-3.5 h-3.5" />
            <span>{transports.length} Rides Planned</span>
          </span>
        </div>
      </div>
    </section>
  );
};
