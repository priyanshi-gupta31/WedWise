import React from 'react';

/**
 * WeddingHeroArt — Major signature hero illustration for WedWise.
 * Layered Indian wedding composition featuring:
 * 1. Grand Mandap / Jharokha architectural arch with block-print jaali lattice
 * 2. Marigold (genda) and mango leaf ceremonial toran garland
 * 3. Majestic royal Indian couple in celebratory attire (lehenga & sherwani with safa)
 * 4. Interlocking wedding rings emblem
 * 5. Floating sindoor & marigold petals
 */
export const WeddingHeroArt: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg
    viewBox="0 0 540 640"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Royal Indian Wedding Mandap & Couple Hero Illustration"
  >
    <defs>
      {/* Gradients */}
      <linearGradient id="heroWine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7A1830" />
        <stop offset="60%" stopColor="#5A1224" />
        <stop offset="100%" stopColor="#3B0A16" />
      </linearGradient>

      <linearGradient id="heroSindoor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E24A37" />
        <stop offset="70%" stopColor="#C93B2B" />
        <stop offset="100%" stopColor="#962215" />
      </linearGradient>

      <linearGradient id="heroMarigold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F9C35A" />
        <stop offset="50%" stopColor="#E89838" />
        <stop offset="100%" stopColor="#C47318" />
      </linearGradient>

      <linearGradient id="heroIndigo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2D1F3B" />
        <stop offset="100%" stopColor="#1B1220" />
      </linearGradient>

      <linearGradient id="heroGoldFoil" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF2D4" />
        <stop offset="40%" stopColor="#F0C766" />
        <stop offset="75%" stopColor="#D4A13A" />
        <stop offset="100%" stopColor="#A87720" />
      </linearGradient>

      <radialGradient id="celestialHalo" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor="#F5C86C" stopOpacity="0.32" />
        <stop offset="50%" stopColor="#E89838" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#5A1224" stopOpacity="0" />
      </radialGradient>

      {/* Block-Print Jaali Lattice Pattern */}
      <pattern id="jaaliLattice" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 20 10 L 10 20 L 0 10 Z" fill="none" stroke="#F5C86C" strokeWidth="0.75" strokeOpacity="0.35" />
        <circle cx="10" cy="10" r="1.5" fill="#F5C86C" fillOpacity="0.4" />
      </pattern>
    </defs>

    {/* BACKDROP: Celestial Mandap Glow */}
    <circle cx="270" cy="300" r="260" fill="url(#celestialHalo)" />

    {/* LAYER 1: GRAND ARCHITECTURAL MANDAP / JHAROKHA ARCH */}
    <g id="mandap-arch">
      {/* Outer Grand Arch Silhouette */}
      <path
        d="M 50 630 V 260
           C 50 140, 150 70, 270 45
           C 390 70, 490 140, 490 260
           V 630"
        stroke="url(#heroGoldFoil)"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Inner Scalloped Cusps Arch */}
      <path
        d="M 80 630 V 280
           C 80 230, 110 185, 155 155
           C 180 140, 220 120, 270 95
           C 320 120, 360 140, 385 155
           C 430 185, 460 230, 460 280
           V 630"
        stroke="#E89838"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.75"
      />

      {/* Jaali lattice pattern fill in arch upper crest */}
      <path
        d="M 80 280 C 80 180, 160 100, 270 70 C 380 100, 460 180, 460 280 Z"
        fill="url(#jaaliLattice)"
        opacity="0.6"
      />

      {/* Arch Crown Kalash Finial with Auspicious Coconut & Mango Leaves */}
      <g transform="translate(270, 45)">
        <path d="M -12 0 C -12 -12, 12 -12, 12 0 Z" fill="url(#heroGoldFoil)" />
        <circle cx="0" cy="-14" r="7" fill="url(#heroMarigold)" />
        <path d="M 0 -21 Q -5 -32 0 -38 Q 5 -32 0 -21 Z" fill="url(#heroGoldFoil)" />
        <circle cx="0" cy="-38" r="2.5" fill="#FFF7ED" />
      </g>

      {/* Hanging Brass Temple Bells & Festive Tassels */}
      {[105, 175, 365, 435].map((x, i) => (
        <g key={i} transform={`translate(${x}, 200)`}>
          <line x1="0" y1="-40" x2="0" y2="0" stroke="#F5C86C" strokeWidth="1" strokeDasharray="3 2" />
          {/* Bell body */}
          <path d="M -7 14 C -7 4, 7 4, 7 14 C 9 17, -9 17, -7 14 Z" fill="url(#heroGoldFoil)" />
          <circle cx="0" cy="18" r="2" fill="#E89838" />
        </g>
      ))}
    </g>

    {/* LAYER 2: FESTIVE MARIGOLD (GENDA PHOOL) & MANGO LEAF TORAN GARLAND */}
    <g id="floral-garland">
      {/* Flowing garland curves across the arch */}
      <path
        d="M 60 260
           Q 150 330 270 290
           Q 390 330 480 260"
        stroke="#87957D"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />

      {/* Marigold Blossom Clusters along the curve */}
      {[
        { x: 70, y: 265, r: 9, c: '#E89838' },
        { x: 105, y: 285, r: 11, c: '#F9C35A' },
        { x: 145, y: 302, r: 10, c: '#C93B2B' },
        { x: 185, y: 308, r: 12, c: '#E89838' },
        { x: 230, y: 300, r: 11, c: '#F9C35A' },
        { x: 270, y: 292, r: 14, c: '#E89838', highlight: true },
        { x: 310, y: 300, r: 11, c: '#F9C35A' },
        { x: 355, y: 308, r: 12, c: '#E89838' },
        { x: 395, y: 302, r: 10, c: '#C93B2B' },
        { x: 435, y: 285, r: 11, c: '#F9C35A' },
        { x: 470, y: 265, r: 9, c: '#E89838' },
      ].map((flower, i) => (
        <g key={i} transform={`translate(${flower.x}, ${flower.y})`}>
          {/* Flower petals geometry */}
          <circle cx="0" cy="0" r={flower.r} fill={flower.c} />
          <circle cx="0" cy="0" r={flower.r * 0.65} fill={flower.c === '#F9C35A' ? '#E89838' : '#F9C35A'} />
          <circle cx="0" cy="0" r={flower.r * 0.3} fill="#5A1224" />
        </g>
      ))}
    </g>

    {/* LAYER 3: THE ROYAL COUPLE (COMMANDING SCALE ~2.5X VISUAL PRESENCE) */}

    {/* GROOM FIGURE (Traditional Regal Sherwani with Safa Turban & Kalgi) */}
    <g id="groom" transform="translate(170, 160)">
      {/* Aura / Shadow */}
      <ellipse cx="65" cy="420" rx="40" ry="10" fill="#1B1220" opacity="0.4" />

      {/* Head & Neck */}
      <circle cx="65" cy="55" r="23" fill="#F6C6B6" />
      <rect x="58" y="75" width="14" height="15" rx="3" fill="#E8B5A5" />

      {/* Regal Marigold & Gold Safa (Turban) with Pleats */}
      <path
        d="M 40 52
           C 38 28, 55 16, 75 18
           C 92 20, 96 36, 88 52
           C 80 56, 50 56, 40 52 Z"
        fill="url(#heroMarigold)"
      />
      {/* Turban Band & Folds */}
      <path d="M 42 46 Q 65 38 86 46" stroke="#C93B2B" strokeWidth="3" />
      <path d="M 44 38 Q 65 30 84 38" stroke="#D4A13A" strokeWidth="2.5" />

      {/* Kalgi / Sarpech (Royal Plume Jewel on Turban) */}
      <circle cx="78" cy="20" r="4.5" fill="url(#heroGoldFoil)" />
      <circle cx="78" cy="20" r="2" fill="#C93B2B" />
      <path
        d="M 78 16 Q 88 2 84 -8 Q 78 2 77 14"
        stroke="url(#heroGoldFoil)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Royal Sherwani Body (Deep Indigo / Charcoal with Gold Buttons) */}
      <path
        d="M 38 86
           L 46 220
           L 96 220
           L 98 86
           Q 67 76 38 86 Z"
        fill="url(#heroIndigo)"
      />

      {/* Gold Placket Embroidery & Regal Buttons */}
      <line x1="68" y1="88" x2="68" y2="215" stroke="url(#heroGoldFoil)" strokeWidth="2.5" />
      {[102, 124, 146, 168, 190].map((y, idx) => (
        <circle key={idx} cx="68" cy={y} r="2.5" fill="url(#heroGoldFoil)" />
      ))}

      {/* Sindoor Red Stole (Dupatta) Draped Gracefully Across Shoulder */}
      <path
        d="M 40 90
           C 30 140, 26 210, 32 290
           C 38 296, 46 294, 46 280
           C 42 210, 46 150, 54 94 Z"
        fill="url(#heroSindoor)"
      />
      {/* Stole Zari Gold Border */}
      <path d="M 32 284 C 36 288, 44 288, 46 280" stroke="url(#heroGoldFoil)" strokeWidth="3" />

      {/* Churidar Pants */}
      <path d="M 50 220 L 54 400 L 70 400 L 67 220 Z" fill="#2D1F3B" />
      <path d="M 77 220 L 75 400 L 91 400 L 93 220 Z" fill="#2D1F3B" />

      {/* Mojari Shoes with Curved Tip */}
      <path d="M 48 398 Q 44 408 68 408 L 71 398 Z" fill="url(#heroGoldFoil)" />
      <path d="M 74 398 Q 70 408 94 408 L 97 398 Z" fill="url(#heroGoldFoil)" />
    </g>

    {/* BRIDE FIGURE (Traditional Royal Lehenga, Choli, & Flowing Veil) */}
    <g id="bride" transform="translate(250, 180)">
      {/* Aura / Shadow */}
      <ellipse cx="65" cy="400" rx="55" ry="12" fill="#1B1220" opacity="0.4" />

      {/* Head & Bridal Hair Bun */}
      <circle cx="65" cy="45" r="21" fill="#F6C6B6" />
      {/* Intricate Bridal Hair Adornment */}
      <path d="M 46 42 C 48 20, 82 20, 84 42 Z" fill="#1B1220" />

      {/* Maang Tikka Jewelry on Forehead */}
      <line x1="65" y1="23" x2="65" y2="35" stroke="url(#heroGoldFoil)" strokeWidth="1.5" />
      <circle cx="65" cy="35" r="3.5" fill="url(#heroGoldFoil)" />
      <circle cx="65" cy="35" r="1.5" fill="#C93B2B" />

      {/* Bridal Choli / Blouse (Sindoor Red & Gold Trim) */}
      <path
        d="M 46 66
           L 48 115
           L 84 115
           L 86 66
           Q 66 60 46 66 Z"
        fill="url(#heroSindoor)"
      />

      {/* Kundan Choker Necklace */}
      <path d="M 52 68 Q 66 78 80 68" stroke="url(#heroGoldFoil)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 55 76 Q 66 84 77 76" stroke="#E89838" strokeWidth="1.5" />

      {/* Voluminous Bridal Lehenga Skirt with Zari Embroidery Motifs */}
      <path
        d="M 48 118
           C 30 180, 5 280, -12 375
           C 25 390, 120 390, 155 375
           C 140 280, 110 180, 84 118 Z"
        fill="url(#heroWine)"
      />

      {/* Elaborate Heavy Gold Zari Border on Lehenga Hem */}
      <path
        d="M -9 366 C 25 382, 118 382, 151 366"
        stroke="url(#heroGoldFoil)"
        strokeWidth="6"
      />
      <path
        d="M -3 354 C 28 370, 112 370, 143 354"
        stroke="#E89838"
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />

      {/* Decorative Buta (Floral Booti) on Skirt */}
      {[
        { x: 30, y: 220 },
        { x: 70, y: 210 },
        { x: 100, y: 230 },
        { x: 15, y: 290 },
        { x: 55, y: 280 },
        { x: 95, y: 285 },
        { x: 130, y: 300 },
      ].map((pos, i) => (
        <circle key={i} cx={pos.x} cy={pos.y} r="2.5" fill="url(#heroGoldFoil)" opacity="0.8" />
      ))}

      {/* Cascading Translucent Blush Bridal Dupatta (Veil) */}
      <path
        d="M 46 40
           C 20 80, 2 170, -25 280
           C -20 284, -12 280, -6 270
           C 15 170, 32 90, 52 46 Z"
        fill="#F6C6B6"
        fillOpacity="0.45"
      />
      {/* Dupatta Scalloped Kiran Gold Lace Edge */}
      <path
        d="M 46 40 C 20 80, 2 170, -25 280"
        stroke="url(#heroGoldFoil)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>

    {/* LAYER 4: INTERLOCKING RINGS EMBLEM FLOATING BETWEEN COUPLE */}
    <g id="interlocking-rings" transform="translate(242, 290)">
      <circle cx="16" cy="16" r="14" stroke="url(#heroGoldFoil)" strokeWidth="3.5" fill="none" />
      <circle cx="32" cy="16" r="14" stroke="#E89838" strokeWidth="3.5" fill="none" />
      {/* Solitaire diamond highlight */}
      <polygon points="24,4 30,12 24,18 18,12" fill="#FFF7ED" stroke="url(#heroGoldFoil)" strokeWidth="1.5" />
      <circle cx="24" cy="12" r="2.5" fill="#E89838" />
    </g>

    {/* LAYER 5: FESTIVE SCATTER OF MARIGOLD & ROSE PETALS + SPARKLES */}
    <g id="celebration-particles">
      {[
        { x: 80, y: 150, r: 4.5, c: '#E89838' },
        { x: 110, y: 110, r: 3.5, c: '#C93B2B' },
        { x: 440, y: 130, r: 4, c: '#F9C35A' },
        { x: 480, y: 180, r: 5, c: '#E89838' },
        { x: 90, y: 460, r: 5.5, c: '#C93B2B' },
        { x: 120, y: 520, r: 4, c: '#F9C35A' },
        { x: 450, y: 490, r: 4.5, c: '#E89838' },
        { x: 480, y: 540, r: 5, c: '#C93B2B' },
      ].map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity="0.85" className="animate-float-gentle" />
      ))}
    </g>
  </svg>
);
