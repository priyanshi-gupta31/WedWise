import React from 'react';

interface FloralArchArtProps {
  className?: string;
  variant?: 'arch' | 'mandala' | 'corner';
  strokeColor?: string;
  accentColor?: string;
}

export const FloralArchArt: React.FC<FloralArchArtProps> = ({
  className = '',
  variant = 'arch',
  strokeColor = '#E5DDD1',
  accentColor = '#C6A15B',
}) => {
  if (variant === 'corner') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M0 0C40 0 100 60 100 100M0 15C35 15 85 65 85 100M0 30C30 30 70 70 70 100"
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle cx="20" cy="20" r="3" fill={accentColor} opacity="0.6" />
        <circle cx="45" cy="45" r="2" fill={strokeColor} />
      </svg>
    );
  }

  if (variant === 'mandala') {
    return (
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle cx="150" cy="150" r="140" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="150" cy="150" r="110" stroke={accentColor} strokeWidth="0.8" opacity="0.4" />
        <circle cx="150" cy="150" r="80" stroke={strokeColor} strokeWidth="1" />
        <circle cx="150" cy="150" r="50" stroke={accentColor} strokeWidth="1.2" opacity="0.7" />

        {/* 8 Floral Petals radiating outward */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 150 150)`}>
            <path
              d="M150 70 C140 100 140 120 150 150 C160 120 160 100 150 70 Z"
              stroke={accentColor}
              strokeWidth="0.8"
              fill="none"
              opacity="0.35"
            />
            <circle cx="150" cy="60" r="2.5" fill={accentColor} opacity="0.6" />
          </g>
        ))}
      </svg>
    );
  }

  // Default: Royal Architectural Indian Wedding Arch (Jharokha Contour)
  return (
    <svg
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Arch Frame */}
      <path
        d="M30 600 V260 C30 160 100 40 200 40 C300 40 370 160 370 260 V600"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* Inner Decorative Arch Foil */}
      <path
        d="M50 600 V265 C50 175 115 65 200 65 C285 65 350 175 350 265 V600"
        stroke={accentColor}
        strokeWidth="1"
        opacity="0.5"
        strokeDasharray="4 3"
      />

      {/* Center Pinnacle Point (Kalash / Teardrop Motif) */}
      <path
        d="M200 20 C195 30 190 35 200 40 C210 35 205 30 200 20 Z"
        fill={accentColor}
        opacity="0.8"
      />
      <circle cx="200" cy="15" r="2" fill={accentColor} />

      {/* Scalloped Arch Curves */}
      <path
        d="M75 300 C75 220 120 110 200 110 C280 110 325 220 325 300"
        stroke={strokeColor}
        strokeWidth="0.75"
        opacity="0.7"
      />

      {/* Suspended Floral Toran / Chandelier Garlands */}
      <path
        d="M100 260 Q150 290 200 260 Q250 290 300 260"
        stroke={accentColor}
        strokeWidth="0.8"
        opacity="0.4"
      />
      <circle cx="150" cy="285" r="2" fill={accentColor} opacity="0.6" />
      <circle cx="200" cy="260" r="2.5" fill={accentColor} opacity="0.8" />
      <circle cx="250" cy="285" r="2" fill={accentColor} opacity="0.6" />

      {/* Fine Geometric Pillars */}
      <line x1="30" y1="280" x2="50" y2="280" stroke={strokeColor} strokeWidth="1" />
      <line x1="350" y1="280" x2="370" y2="280" stroke={strokeColor} strokeWidth="1" />
      <line x1="30" y1="420" x2="50" y2="420" stroke={strokeColor} strokeWidth="1" />
      <line x1="350" y1="420" x2="370" y2="420" stroke={strokeColor} strokeWidth="1" />

      {/* Ground Rosette Elements */}
      <circle cx="100" cy="520" r="12" stroke={strokeColor} strokeWidth="0.75" strokeDasharray="2 2" />
      <circle cx="300" cy="520" r="12" stroke={strokeColor} strokeWidth="0.75" strokeDasharray="2 2" />
    </svg>
  );
};
