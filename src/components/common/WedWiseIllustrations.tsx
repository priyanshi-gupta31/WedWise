import React from 'react';

/**
 * 1. Abstract Modern Indian Wedding Couple Vector Art
 * Minimalist, elegant silhouette of a couple in Indian wedding attire (lehenga / sherwani)
 * surrounded by floral arches, festive petals, and champagne halo.
 */
export const CoupleCelebrationArt: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg
    viewBox="0 0 400 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Wedding Couple Celebration Illustration"
  >
    <defs>
      <linearGradient id="wineGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#852C47" />
        <stop offset="100%" stopColor="#641F35" />
      </linearGradient>
      <linearGradient id="coralGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F28B7E" />
        <stop offset="100%" stopColor="#E86A5B" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F7EED9" />
        <stop offset="50%" stopColor="#D6B36A" />
        <stop offset="100%" stopColor="#B8944B" />
      </linearGradient>
      <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F6C6B6" stopOpacity="0.45" />
        <stop offset="70%" stopColor="#FFF7ED" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Backdrop Celebration Glow & Arch */}
    <circle cx="200" cy="180" r="150" fill="url(#haloGrad)" />
    
    {/* Architectural Arch Outline */}
    <path
      d="M 100 290 V 160 C 100 100, 150 60, 200 45 C 250 60, 300 100, 300 160 V 290"
      stroke="#D6B36A"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      opacity="0.6"
    />
    
    {/* Arch Crown Finial / Kalash Motif */}
    <circle cx="200" cy="40" r="4" fill="#D6B36A" />
    <path d="M 197 40 Q 200 30 203 40 Z" fill="#D6B36A" />

    {/* Floral Garland (Toran) draping the arch */}
    <path
      d="M 105 160 Q 150 190 200 170 Q 250 190 295 160"
      stroke="#E86A5B"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.75"
    />
    {/* Garland marigold blossom dots */}
    {[110, 130, 155, 175, 200, 225, 245, 270, 290].map((cx, i) => (
      <circle key={i} cx={cx} cy={160 + Math.sin(i * 0.7) * 12} r="4" fill={i % 2 === 0 ? "#E86A5B" : "#D6B36A"} />
    ))}

    {/* Groom Figure (Sherwani Silhouette with Stole/Dupatta) */}
    <g transform="translate(140, 95)">
      {/* Head & Pagri (Turban) */}
      <circle cx="45" cy="30" r="16" fill="#F6C6B6" />
      {/* Regal Turban with Kalgi plume */}
      <path
        d="M 30 28 C 30 14, 40 8, 55 10 C 65 12, 68 22, 60 28 Z"
        fill="url(#wineGrad)"
      />
      <circle cx="58" cy="12" r="3" fill="#D6B36A" />
      <path d="M 58 10 Q 64 2 62 -4 Q 57 2 57 8" stroke="#D6B36A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Torso / Sherwani */}
      <path
        d="M 28 45 L 34 110 L 64 110 L 66 45 Q 47 40 28 45 Z"
        fill="#29202A"
      />
      {/* Royal Kurta Gold Placket Buttons */}
      <line x1="47" y1="46" x2="47" y2="105" stroke="#D6B36A" strokeWidth="1.5" />
      <circle cx="47" cy="55" r="1.5" fill="#D6B36A" />
      <circle cx="47" cy="67" r="1.5" fill="#D6B36A" />
      <circle cx="47" cy="79" r="1.5" fill="#D6B36A" />

      {/* Royal Stole (Dupatta) draped over shoulder */}
      <path
        d="M 30 46 C 24 70, 22 100, 26 130 C 29 135, 34 135, 34 128 C 30 100, 32 75, 38 48 Z"
        fill="url(#coralGrad)"
      />

      {/* Lower Sherwani / Churidar */}
      <path d="M 36 110 L 39 190 L 49 190 L 46 110 Z" fill="#423444" />
      <path d="M 53 110 L 51 190 L 61 190 L 63 110 Z" fill="#423444" />
      {/* Mojari shoes */}
      <path d="M 35 188 Q 33 194 48 194 Z" fill="#D6B36A" />
      <path d="M 52 188 Q 50 194 65 194 Z" fill="#D6B36A" />
    </g>

    {/* Bride Figure (Bridal Lehenga & Dupatta) */}
    <g transform="translate(185, 105)">
      {/* Head & Traditional Maang Tikka */}
      <circle cx="40" cy="26" r="14" fill="#F6C6B6" />
      <path d="M 27 24 C 28 12, 50 12, 53 24 Z" fill="#29202A" />
      <circle cx="40" cy="18" r="2.5" fill="#D6B36A" />
      <path d="M 40 18 L 40 23" stroke="#D6B36A" strokeWidth="1" />

      {/* Blouse (Choli) */}
      <path
        d="M 28 38 L 29 65 L 51 65 L 52 38 Q 40 35 28 38 Z"
        fill="url(#coralGrad)"
      />
      {/* Gold necklace choker */}
      <path d="M 33 39 Q 40 46 47 39" stroke="#D6B36A" strokeWidth="2" strokeLinecap="round" />

      {/* Voluminous Bridal Lehenga Skirt */}
      <path
        d="M 29 68 C 18 100, 2 145, -5 180 C 15 188, 70 188, 85 180 C 78 145, 62 100, 51 68 Z"
        fill="url(#wineGrad)"
      />
      {/* Ornate Gold Border & Zari Buta */}
      <path
        d="M -2 174 C 18 182, 68 182, 82 174"
        stroke="#D6B36A"
        strokeWidth="3.5"
      />
      <path
        d="M 5 166 C 22 173, 62 173, 76 166"
        stroke="#D6B36A"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Sheer Bridal Veil (Dupatta) cascading softly */}
      <path
        d="M 27 24 C 15 45, 5 95, -12 150 C -10 152, -4 150, 0 145 C 12 95, 22 55, 33 28 Z"
        fill="#F6C6B6"
        fillOpacity="0.4"
      />
      <path
        d="M 27 24 C 15 45, 5 95, -12 150"
        stroke="#D6B36A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>

    {/* Interlocking Rings Emblem floating between them */}
    <g transform="translate(182, 175)">
      <circle cx="12" cy="12" r="10" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="12" r="10" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
      <circle cx="18" cy="4" r="2.5" fill="#FFF7ED" stroke="#D6B36A" strokeWidth="1" />
    </g>

    {/* Floating celebratory marigold petals & sparkles */}
    {[
      { x: 90, y: 120, r: 3, c: "#E86A5B" },
      { x: 110, y: 90, r: 2.5, c: "#D6B36A" },
      { x: 310, y: 110, r: 3, c: "#E86A5B" },
      { x: 290, y: 80, r: 2, c: "#D6B36A" },
      { x: 330, y: 220, r: 3.5, c: "#F6C6B6" },
      { x: 70, y: 230, r: 2.5, c: "#D6B36A" },
      { x: 140, y: 310, r: 3, c: "#E86A5B" },
      { x: 260, y: 310, r: 3, c: "#D6B36A" },
    ].map((p, idx) => (
      <circle key={idx} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity="0.8" className="animate-float-gentle" />
    ))}
  </svg>
);

/**
 * 2. Grand Architectural Jharokha Archway with Mandala and Lights
 */
export const IndianArchArt: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg
    viewBox="0 0 320 280"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Indian Wedding Arch"
  >
    <defs>
      <linearGradient id="archWine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#641F35" />
        <stop offset="100%" stopColor="#4A1425" />
      </linearGradient>
    </defs>
    {/* Outer Jharokha Silhouette */}
    <path
      d="M 30 270 V 140 C 30 80, 80 40, 160 20 C 240 40, 290 80, 290 140 V 270"
      stroke="#D6B36A"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M 50 270 V 150 C 50 100, 95 65, 160 45 C 225 65, 270 100, 270 150 V 270"
      stroke="#E86A5B"
      strokeWidth="1.2"
      strokeDasharray="5 4"
      fill="none"
    />
    {/* Central Crown Finial */}
    <path d="M 155 20 Q 160 5 165 20 Z" fill="#D6B36A" />
    <circle cx="160" cy="5" r="3" fill="#E86A5B" />

    {/* Hanging Hanging Floral Garland Tassels */}
    {[-50, 0, 50].map((offset, i) => (
      <g key={i} transform={`translate(${160 + offset}, 70)`}>
        <line x1="0" y1="0" x2="0" y2="45" stroke="#D6B36A" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="0" cy="48" r="4" fill="#E86A5B" />
        <circle cx="0" cy="56" r="3" fill="#D6B36A" />
      </g>
    ))}

    {/* Diya / Festive Lamp at Base */}
    <g transform="translate(145, 230)">
      <path d="M 5 20 Q 15 32 25 20 Z" fill="#D6B36A" />
      <path d="M 15 20 Q 15 6 15 4 Q 19 12 15 20 Z" fill="#E86A5B" />
      <circle cx="15" cy="14" r="2.5" fill="#FFF7ED" />
    </g>
  </svg>
);

/**
 * 3. Interlocking Rings Celebration Emblem
 */
export const WeddingRingsArt: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="44" r="22" stroke="#D6B36A" strokeWidth="4" />
    <circle cx="48" cy="44" r="22" stroke="#E86A5B" strokeWidth="4" />
    {/* Diamond Jewel */}
    <polygon points="32,14 38,22 32,30 26,22" fill="#FFF7ED" stroke="#D6B36A" strokeWidth="2" />
    <circle cx="32" cy="22" r="2" fill="#D6B36A" />
    {/* Sparkle Glint */}
    <path d="M 48 16 L 50 20 L 54 22 L 50 24 L 48 28 L 46 24 L 42 22 L 46 20 Z" fill="#D6B36A" />
  </svg>
);

/**
 * 4. Reusable Category Motifs with bespoke Indian wedding artwork
 */
export const CategoryArtwork: React.FC<{
  category: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ category, className = '', size = 'md' }) => {
  const norm = category.toLowerCase();
  const dimension = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';

  // Photography
  if (norm.includes('photo') || norm.includes('video')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <rect x="6" y="11" width="28" height="21" rx="5" fill="#641F35" fillOpacity="0.12" stroke="#641F35" strokeWidth="2" />
        <circle cx="20" cy="21.5" r="6" stroke="#D6B36A" strokeWidth="2.5" />
        <circle cx="20" cy="21.5" r="2.5" fill="#E86A5B" />
        <path d="M 13 11 L 15 7 L 25 7 L 27 11 Z" fill="#641F35" />
        <circle cx="29" cy="16" r="1.5" fill="#D6B36A" />
      </svg>
    );
  }

  // Catering & Food
  if (norm.includes('cater') || norm.includes('food') || norm.includes('dinner') || norm.includes('lunch')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <circle cx="20" cy="20" r="14" fill="#E86A5B" fillOpacity="0.1" stroke="#E86A5B" strokeWidth="2" />
        <circle cx="20" cy="20" r="10" stroke="#D6B36A" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Royal Sweets / Katori bowls */}
        <circle cx="16" cy="17" r="3" fill="#641F35" />
        <circle cx="24" cy="17" r="3" fill="#D6B36A" />
        <circle cx="20" cy="24" r="3" fill="#E86A5B" />
      </svg>
    );
  }

  // Decoration & Florals
  if (norm.includes('decor') || norm.includes('flower') || norm.includes('floral') || norm.includes('mandap')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <circle cx="20" cy="20" r="4.5" fill="#D6B36A" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 20 + Math.cos(rad) * 9;
          const cy = 20 + Math.sin(rad) * 9;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3.5"
              fill={i % 2 === 0 ? "#E86A5B" : "#641F35"}
              fillOpacity="0.85"
            />
          );
        })}
      </svg>
    );
  }

  // Clothing, Attire, Lehenga, Sherwani
  if (norm.includes('cloth') || norm.includes('attire') || norm.includes('dress') || norm.includes('lehenga') || norm.includes('wear')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <path d="M 20 8 Q 23 13 27 13 L 31 16 L 27 20 L 25 18 L 29 32 L 11 32 L 15 18 L 13 20 L 9 16 L 13 13 Q 17 13 20 8 Z" fill="#641F35" fillOpacity="0.12" stroke="#641F35" strokeWidth="2" />
        <line x1="20" y1="12" x2="20" y2="32" stroke="#D6B36A" strokeWidth="1.5" />
        <circle cx="20" cy="8" r="2" fill="#D6B36A" />
      </svg>
    );
  }

  // Venue
  if (norm.includes('venue') || norm.includes('hall') || norm.includes('resort') || norm.includes('hotel') || norm.includes('palace')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <path d="M 8 32 V 18 C 8 13, 14 9, 20 7 C 26 9, 32 13, 32 18 V 32 Z" fill="#641F35" fillOpacity="0.1" stroke="#641F35" strokeWidth="2" />
        <path d="M 14 32 V 22 C 14 18, 20 16, 20 16 C 20 16, 26 18, 26 22 V 32" stroke="#D6B36A" strokeWidth="2" />
        <circle cx="20" cy="5" r="2" fill="#E86A5B" />
      </svg>
    );
  }

  // Jewellery
  if (norm.includes('jewel') || norm.includes('gold') || norm.includes('ring')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <circle cx="20" cy="22" r="10" stroke="#D6B36A" strokeWidth="2.5" />
        <polygon points="20,7 25,12 20,17 15,12" fill="#FFF7ED" stroke="#E86A5B" strokeWidth="2" />
        <circle cx="20" cy="12" r="1.5" fill="#641F35" />
      </svg>
    );
  }

  // Music, Band, DJ, Sangeet
  if (norm.includes('music') || norm.includes('dj') || norm.includes('sangeet') || norm.includes('band')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <ellipse cx="14" cy="27" rx="5" ry="3.5" fill="#641F35" />
        <ellipse cx="27" cy="23" rx="5" ry="3.5" fill="#E86A5B" />
        <path d="M 19 27 V 10 L 32 6 V 23" stroke="#29202A" strokeWidth="2" />
        <line x1="19" y1="12" x2="32" y2="8" stroke="#D6B36A" strokeWidth="3" />
      </svg>
    );
  }

  // Transportation, Car, Doli
  if (norm.includes('transport') || norm.includes('car') || norm.includes('travel')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
        <path d="M 7 24 L 11 15 C 12 13 14 12 17 12 L 23 12 C 26 12 28 13 29 15 L 33 24 Z" fill="#641F35" fillOpacity="0.12" stroke="#641F35" strokeWidth="2" />
        <rect x="6" y="22" width="28" height="6" rx="2" fill="#E86A5B" />
        <circle cx="12" cy="29" r="3.5" fill="#29202A" stroke="#D6B36A" strokeWidth="1.5" />
        <circle cx="28" cy="29" r="3.5" fill="#29202A" stroke="#D6B36A" strokeWidth="1.5" />
      </svg>
    );
  }

  // Default / Miscellaneous celebration
  return (
    <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`}>
      <circle cx="20" cy="20" r="14" fill="#D6B36A" fillOpacity="0.15" stroke="#D6B36A" strokeWidth="1.5" />
      <path d="M 20 10 L 23 17 L 30 20 L 23 23 L 20 30 L 17 23 L 10 20 L 17 17 Z" fill="#E86A5B" />
      <circle cx="20" cy="20" r="2.5" fill="#641F35" />
    </svg>
  );
};

/**
 * EventArtwork — Dedicated Indian Wedding Ceremonial Vector Motifs
 * Supporting: Engagement, Haldi, Mehendi, Sangeet, Wedding, Reception, and Custom ceremonies.
 */
export const EventArtwork: React.FC<{
  eventType?: string;
  type?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ eventType, type, size = 'md', className = '' }) => {
  const effectiveType = type || eventType || '';
  const norm = effectiveType.toLowerCase().trim();
  const sizeClass =
    size === 'sm'
      ? 'w-5 h-5'
      : size === 'lg'
      ? 'w-10 h-10'
      : size === 'xl'
      ? 'w-16 h-16'
      : 'w-7 h-7';

  // 1. Engagement → Interlocking Rings
  if (norm.includes('engage') || norm.includes('ring') || norm.includes('roka') || norm.includes('sagai')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Engagement Ring Motif">
        <circle cx="16" cy="22" r="8" stroke="#D6B36A" strokeWidth="2.5" />
        <circle cx="24" cy="20" r="8" stroke="#E89838" strokeWidth="2.5" />
        <polygon points="16,8 20,13 16,17 12,13" fill="#FFFDF9" stroke="#641F35" strokeWidth="1.5" />
        <circle cx="16" cy="13" r="1.5" fill="#E89838" />
      </svg>
    );
  }

  // 2. Haldi → Auspicious Diya / Turmeric Bowl Motif
  if (norm.includes('haldi') || norm.includes('ubtan') || norm.includes('yellow') || norm.includes('pithi')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Haldi Motif">
        <ellipse cx="20" cy="26" rx="13" ry="6" fill="#FFF2E0" stroke="#D6B36A" strokeWidth="2" />
        <path d="M 8 26 C 8 32, 32 32, 32 26" fill="#E89838" />
        <path d="M 20 9 C 23 15, 25 18, 20 22 C 15 18, 17 15, 20 9 Z" fill="#C93B2B" stroke="#D6B36A" strokeWidth="1" />
        <circle cx="20" cy="18" r="2" fill="#E89838" />
      </svg>
    );
  }

  // 3. Mehendi → Henna Paisley / Vine Motif
  if (norm.includes('mehendi') || norm.includes('mehndi') || norm.includes('henna')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Mehendi Henna Motif">
        <path
          d="M 12 30 C 12 20, 26 24, 23 14 C 21 8, 28 8, 28 14 C 28 26, 14 26, 22 34"
          stroke="#2D5A43"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="19" r="2" fill="#2D5A43" />
        <circle cx="16" cy="24" r="1.5" fill="#E89838" />
        <circle cx="24" cy="25" r="1.5" fill="#E89838" />
        <circle cx="27" cy="13" r="1.5" fill="#C93B2B" />
      </svg>
    );
  }

  // 4. Sangeet → Celebratory Musical Dhol / Rhythm
  if (norm.includes('sangeet') || norm.includes('music') || norm.includes('dance') || norm.includes('garba') || norm.includes('cocktail')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Sangeet Dhol Motif">
        <rect x="10" y="14" width="20" height="14" rx="4" fill="#641F35" stroke="#D6B36A" strokeWidth="1.5" />
        <ellipse cx="10" cy="21" rx="2.5" ry="7" fill="#E89838" stroke="#D6B36A" strokeWidth="1" />
        <ellipse cx="30" cy="21" rx="2.5" ry="7" fill="#E89838" stroke="#D6B36A" strokeWidth="1" />
        <line x1="12" y1="14" x2="28" y2="28" stroke="#D6B36A" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="12" y1="28" x2="28" y2="14" stroke="#D6B36A" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="20" cy="8" r="2" fill="#C93B2B" />
      </svg>
    );
  }

  // 5. Wedding / Ceremony → Royal Mandap Arch & Garland
  if (norm.includes('wedding') || norm.includes('shaadi') || norm.includes('vivaah') || norm.includes('pheras') || norm.includes('lagna')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Wedding Mandap Motif">
        <path d="M 8 32 V 17 C 8 11, 14 7, 20 5 C 26 7, 32 11, 32 17 V 32" stroke="#641F35" strokeWidth="2" />
        <path d="M 13 32 V 20 C 13 16, 17 14, 20 14 C 23 14, 27 16, 27 20 V 32" stroke="#D6B36A" strokeWidth="1.5" />
        <circle cx="20" cy="4" r="2" fill="#C93B2B" />
        <path d="M 10 17 Q 20 22 30 17" stroke="#E89838" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Reception → Grand Pavilion / Palace
  if (norm.includes('reception') || norm.includes('dinner') || norm.includes('party')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Reception Palace Motif">
        <path d="M 6 32 V 18 L 20 8 L 34 18 V 32 Z" fill="#641F35" fillOpacity="0.1" stroke="#641F35" strokeWidth="1.5" />
        <path d="M 15 32 V 22 C 15 19, 20 17, 20 17 C 20 17, 25 19, 25 22 V 32" fill="#D6B36A" fillOpacity="0.2" stroke="#D6B36A" strokeWidth="1.5" />
        <circle cx="20" cy="6" r="2" fill="#E89838" />
        <line x1="6" y1="32" x2="34" y2="32" stroke="#641F35" strokeWidth="2" />
      </svg>
    );
  }

  // 7. Default / Custom Ceremony → Kalash & Mango Leaves Motif
  return (
    <svg viewBox="0 0 40 40" fill="none" className={`${sizeClass} ${className}`} aria-label="Auspicious Kalash Motif">
      <ellipse cx="20" cy="27" rx="10" ry="6" fill="#FFF2E0" stroke="#641F35" strokeWidth="2" />
      <path d="M 12 27 C 12 34, 28 34, 28 27" fill="#E89838" />
      <circle cx="20" cy="18" r="5" fill="#D6B36A" />
      <path d="M 16 16 C 14 10, 20 8, 20 8 C 20 8, 26 10, 24 16" fill="#2D5A43" />
      <circle cx="20" cy="7" r="1.5" fill="#C93B2B" />
    </svg>
  );
};

