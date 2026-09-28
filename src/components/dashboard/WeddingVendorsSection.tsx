import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { CategoryArtwork } from '../common/WedWiseIllustrations';
import { formatINR } from '../../utils/currency';
import { Calendar, Phone, ChevronRight, Briefcase } from 'lucide-react';

interface WeddingVendorsSectionProps {
  onNavigateToVendors?: () => void;
}

export const WeddingVendorsSection: React.FC<WeddingVendorsSectionProps> = ({
  onNavigateToVendors,
}) => {
  const { vendors, vendorMetrics } = useWedding();

  const displayVendors = vendors.slice(0, 3);

  return (
    <section className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#F1E4D6] gap-2">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.25em] block mb-1">
            Vendor Partners
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#29202A] tracking-tight">
            Wedding Partners
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#FFF7ED] text-[#641F35] border border-[#F1E4D6]">
            {vendorMetrics.confirmedVendors} Active Contracts
          </span>
          {onNavigateToVendors && (
            <button
              type="button"
              onClick={onNavigateToVendors}
              className="text-xs font-semibold text-[#641F35] hover:text-[#50182A] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {displayVendors.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#FFF7ED]/50 border border-[#F1E4D6] text-center space-y-3">
          <Briefcase className="w-8 h-8 text-[#D6B36A] mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-serif font-bold text-[#29202A]">
              No Wedding Partners Added Yet
            </h3>
            <p className="text-xs text-[#8C7A8E] mt-1">
              Keep caterers, decorators, photographers, and priests coordinated with contracts and payment pacing.
            </p>
          </div>
          {onNavigateToVendors && (
            <button
              type="button"
              onClick={onNavigateToVendors}
              className="px-4 py-2 bg-[#641F35] text-white text-xs font-semibold rounded-xl hover:bg-[#50182A] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              Open Vendor Book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayVendors.map((v) => {
            const totalAgreed = Number(v.agreed_amount) || 0;
            const paid = Number(v.paid_amount) || 0;
            const remaining = Number(v.remaining_amount) || 0;
            const nextDate = v.payment_due_date || v.next_follow_up_date;

            return (
              <div
                key={v.id}
                onClick={onNavigateToVendors}
                className={`p-5 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] hover:border-[#641F35] hover:bg-white transition-all shadow-subtle hover:shadow-card flex flex-col justify-between ${
                  onNavigateToVendors ? 'cursor-pointer' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 shadow-xs">
                      <CategoryArtwork category={v.category} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#E86A5B] uppercase tracking-widest block leading-none truncate">
                        {v.category}
                      </span>
                      <h3 className="text-base font-serif font-bold text-[#29202A] leading-snug truncate">
                        {v.vendor_name}
                      </h3>
                    </div>
                  </div>

                  {/* Total contract value */}
                  <div className="text-xl font-serif font-bold text-[#29202A] mb-3">
                    {formatINR(totalAgreed)}
                  </div>

                  {/* Paid vs Remaining breakdown */}
                  <div className="space-y-1 text-xs pt-3 border-t border-[#F1E4D6]">
                    <div className="flex justify-between">
                      <span className="text-[#615163]">Paid so far:</span>
                      <span className="font-semibold text-[#5D6B53]">{formatINR(paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#615163]">Balance due:</span>
                      <span className="font-serif font-bold text-[#641F35]">
                        {formatINR(remaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next due milestone / contact */}
                <div className="mt-4 pt-3 border-t border-[#F1E4D6] flex items-center justify-between text-[11px] text-[#8C7A8E]">
                  <span className="flex items-center gap-1 truncate">
                    {nextDate ? (
                      <>
                        <Calendar className="w-3 h-3 text-[#D6B36A] flex-shrink-0" />
                        <span className="truncate">Due: {nextDate}</span>
                      </>
                    ) : (
                      <span className="italic">{v.status}</span>
                    )}
                  </span>
                  {v.phone && (
                    <span className="font-medium text-[#29202A] ml-2 flex-shrink-0">
                      {v.phone}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
