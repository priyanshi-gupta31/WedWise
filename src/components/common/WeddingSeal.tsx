import React from 'react';

interface WeddingSealProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'burgundy' | 'marigold' | 'sindoor' | 'gold';
  label?: string;
  sublabel?: string;
  days?: number | string;
  className?: string;
  showRays?: boolean;
}

/**
 * WeddingSeal — A signature WedWise design primitive.
 * Inspired by traditional Indian royal wedding invitation wax seals (lakha/chhap),
 * sacred rangoli geometry, and architectural medallions.
 */
export const WeddingSeal: React.FC<WeddingSealProps> = ({
  size = 'md',
  variant = 'burgundy',
  label = 'WEDWISE',
  sublabel = 'WEDDING SEAL',
  days = '72',
  className = '',
  showRays = true,
}) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  // Color profiles
  const colors = {
    burgundy: {
      outerBg: '#5A1224',
      innerBg: '#420D1A',
      stroke: '#E89838', // Marigold gold
      accent: '#C93B2B', // Sindoor red
      text: '#FFF7ED',
      foil: '#F5C86C',
    },
    sindoor: {
      outerBg: '#C93B2B',
      innerBg: '#9E2417',
      stroke: '#F5C86C',
      accent: '#5A1224',
      text: '#FFF7ED',
      foil: '#F5C86C',
    },
    marigold: {
      outerBg: '#E89838',
      innerBg: '#C77920',
      stroke: '#5A1224',
      accent: '#FFF7ED',
      text: '#420D1A',
      foil: '#FFF7ED',
    },
    gold: {
      outerBg: '#D6B36A',
      innerBg: '#B8944B',
      stroke: '#5A1224',
      accent: '#C93B2B',
      text: '#420D1A',
      foil: '#FFF7ED',
    },
  }[variant];

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeMap[size]} ${className}`}
      aria-label="WedWise Signature Wedding Seal"
    >
      {/* Outer Rangoli Ray Burst (optional) */}
      {showRays && (
        <div className="absolute inset-0 -m-2 opacity-30 animate-spin-slow pointer-events-none">
          <svg viewBox="0 0 140 140" fill="none" className="w-full h-full">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="70"
                y1="8"
                x2="70"
                y2="18"
                stroke={colors.stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${deg} 70 70)`}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Main Wax Seal SVG with Scalloped Edge & Concentric Rangoli Geometry */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          <radialGradient id={`sealGrad-${variant}`} cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor={colors.outerBg} />
            <stop offset="70%" stopColor={colors.innerBg} />
            <stop offset="100%" stopColor="#1B1220" />
          </radialGradient>
          <filter id="emboss" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 16-Lobed Royal Wax Seal / Rangoli Scalloped Perimeter */}
        <path
          d="M 60 6
             C 64 6, 68 8, 71 11
             C 74 9, 78 9, 82 12
             C 86 11, 90 13, 93 17
             C 97 18, 100 21, 102 25
             C 106 28, 107 32, 108 36
             C 111 39, 112 43, 112 48
             C 114 52, 114 56, 113 60
             C 114 64, 114 68, 112 72
             C 112 77, 111 81, 108 84
             C 107 88, 106 92, 102 95
             C 100 99, 97 102, 93 103
             C 90 107, 86 109, 82 108
             C 78 111, 74 111, 71 109
             C 68 112, 64 114, 60 114
             C 56 114, 52 112, 49 109
             C 46 111, 42 111, 38 108
             C 34 109, 30 107, 27 103
             C 23 102, 20 99, 18 95
             C 14 92, 13 88, 12 84
             C 9 81, 8 77, 8 72
             C 6 68, 6 64, 7 60
             C 6 56, 6 52, 8 48
             C 8 43, 9 39, 12 36
             C 13 32, 14 28, 18 25
             C 20 21, 23 18, 27 17
             C 30 13, 34 11, 38 12
             C 42 9, 46 9, 49 11
             C 52 8, 56 6, 60 6 Z"
          fill={`url(#sealGrad-${variant})`}
          stroke={colors.stroke}
          strokeWidth="1.5"
          filter="url(#emboss)"
        />

        {/* Concentric Beaded Rangoli Ring */}
        <circle
          cx="60"
          cy="60"
          r="45"
          stroke={colors.stroke}
          strokeWidth="1"
          strokeDasharray="2.5 2.5"
          opacity="0.85"
        />
        <circle
          cx="60"
          cy="60"
          r="41"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.75"
        />

        {/* 8 Cardinal Rangoli Petal Dots */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 60 + Math.cos(rad) * 36;
          const y = 60 + Math.sin(rad) * 36;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.8"
              fill={colors.foil}
            />
          );
        })}

        {/* Center Circular Medallion */}
        <circle
          cx="60"
          cy="60"
          r="30"
          fill={colors.innerBg}
          stroke={colors.stroke}
          strokeWidth="1.2"
        />

        {/* Centerpiece: Days countdown or stylized Interlocking Rings */}
        {days ? (
          <g>
            <text
              x="60"
              y="56"
              textAnchor="middle"
              fill={colors.foil}
              fontSize="20"
              fontFamily="Cormorant Garamond, Georgia, serif"
              fontWeight="bold"
              letterSpacing="-0.02em"
            >
              {days}
            </text>
            <text
              x="60"
              y="68"
              textAnchor="middle"
              fill={colors.text}
              fontSize="6.5"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              letterSpacing="0.22em"
              opacity="0.9"
            >
              DAYS
            </text>
            <text
              x="60"
              y="75"
              textAnchor="middle"
              fill={colors.stroke}
              fontSize="5"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              letterSpacing="0.18em"
            >
              TO GO
            </text>
          </g>
        ) : (
          <g transform="translate(46, 46)">
            {/* Interlocking Monogram Rings */}
            <circle cx="10" cy="14" r="8" stroke={colors.foil} strokeWidth="1.8" fill="none" />
            <circle cx="18" cy="14" r="8" stroke={colors.stroke} strokeWidth="1.8" fill="none" />
            <circle cx="14" cy="9" r="2" fill={colors.foil} />
          </g>
        )}

        {/* Fine Circular Border */}
        <circle cx="60" cy="60" r="27" stroke={colors.stroke} strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.6" />
      </svg>
    </div>
  );
};
