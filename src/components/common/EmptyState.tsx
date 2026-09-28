import React from 'react';
import { Button } from './Button';
import { IndianArchArt, WeddingRingsArt } from './WedWiseIllustrations';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-[#F1E4D6] shadow-card relative overflow-hidden ${className}`}
    >
      {/* Background delicate arch watermark */}
      <div className="absolute -top-12 -left-12 w-36 h-36 opacity-10 pointer-events-none">
        <IndianArchArt className="w-full h-full" />
      </div>
      <div className="absolute -bottom-12 -right-12 w-36 h-36 opacity-10 pointer-events-none">
        <IndianArchArt className="w-full h-full" />
      </div>

      {/* Center delicate line-art vector illustration */}
      <div className="w-16 h-16 rounded-full bg-[#FFF7ED] border border-[#F1E4D6] flex items-center justify-center text-[#641F35] mb-4 shadow-subtle relative z-10">
        {icon ? (
          icon
        ) : (
          <WeddingRingsArt className="w-8 h-8" />
        )}
      </div>

      {/* Editorial Invitation Header */}
      <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.25em] mb-1.5 block">
        Your Wedding Story Starts Here
      </span>

      <h4 className="text-xl font-serif font-bold text-[#29202A] mb-2 tracking-tight">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-[#615163] max-w-sm mb-6 leading-relaxed font-sans">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-2.5 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] font-semibold text-xs uppercase tracking-wider shadow-wine transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
