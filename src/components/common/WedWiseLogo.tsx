import React from 'react';

interface WedWiseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  inverted?: boolean;
  className?: string;
}

export const WedWiseLogo: React.FC<WedWiseLogoProps> = ({
  size = 'md',
  showTagline = false,
  inverted = false,
  className = '',
}) => {
  const symbolSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Stylized "W" Intersecting Wedding Bands Monogram */}
      <div
        className={`relative flex items-center justify-center flex-shrink-0 ${symbolSizes[size]} transition-transform duration-200 hover:scale-105`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer hairline circle */}
          <circle
            cx="20"
            cy="20"
            r="19"
            stroke={inverted ? 'rgba(255,247,237,0.3)' : '#F1E4D6'}
            strokeWidth="1.2"
          />

          {/* First interlocking wedding ring (Gold/Champagne) */}
          <circle
            cx="16"
            cy="20"
            r="9"
            stroke={inverted ? '#D6B36A' : '#D6B36A'}
            strokeWidth="2.2"
            strokeDasharray="56"
            strokeDashoffset="6"
          />

          {/* Second interlocking wedding ring (Wine / Coral) */}
          <circle
            cx="24"
            cy="20"
            r="9"
            stroke={inverted ? '#E86A5B' : '#641F35'}
            strokeWidth="2.2"
            strokeDasharray="56"
            strokeDashoffset="24"
          />

          {/* Central intersecting focal jewel / star */}
          <path
            d="M20 15L21.4 18.6L25 20L21.4 21.4L20 25L18.6 21.4L15 20L18.6 18.6L20 15Z"
            fill={inverted ? '#FFF7ED' : '#D6B36A'}
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <span
          className={`font-serif font-bold tracking-[0.2em] uppercase leading-none ${textSizes[size]} ${
            inverted ? 'text-[#FFF7ED]' : 'text-[#29202A]'
          }`}
        >
          WedWise
        </span>
        {showTagline && (
          <span
            className={`text-[9px] font-semibold tracking-[0.28em] uppercase mt-1 leading-none ${
              inverted ? 'text-[#F6C6B6]' : 'text-[#E86A5B]'
            }`}
          >
            Plan Smart. Celebrate More.
          </span>
        )}
      </div>
    </div>
  );
};
