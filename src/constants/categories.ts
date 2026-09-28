export interface CategoryDefinition {
  name: string;
  icon: string;
  defaultBudgetWeight: number; // Percentage of total budget for auto-allocation
  description: string;
}

/**
 * WEDWISE CENTRAL WEDDING CATEGORIES
 * The single source of truth for all wedding expense categories across the application.
 */
export const WEDDING_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Venue',
    icon: 'Building',
    defaultBudgetWeight: 0.25,
    description: 'Palace resort, banquet hall, lawns & mandap premises',
  },
  {
    name: 'Catering',
    icon: 'UtensilsCrossed',
    defaultBudgetWeight: 0.25,
    description: 'Royal banquet feasts, live counters, sweets & high tea',
  },
  {
    name: 'Decoration',
    icon: 'Sparkles',
    defaultBudgetWeight: 0.10,
    description: 'Floral mandap canopy, fairy lights, stage & entrance toran',
  },
  {
    name: 'Photography',
    icon: 'Camera',
    defaultBudgetWeight: 0.08,
    description: 'Traditional photography, candid shots, drone & photo albums',
  },
  {
    name: 'Videography',
    icon: 'Video',
    defaultBudgetWeight: 0.05,
    description: 'Cinematic wedding film, teasers, reels & live streaming',
  },
  {
    name: 'Clothing',
    icon: 'Shirt',
    defaultBudgetWeight: 0.07,
    description: 'Bridal lehenga, groom sherwani, safa, stolen & family attire',
  },
  {
    name: 'Jewellery',
    icon: 'Gem',
    defaultBudgetWeight: 0.06,
    description: 'Gold sets, diamond polki, rings, matha patti & accessories',
  },
  {
    name: 'Invitations',
    icon: 'Mail',
    defaultBudgetWeight: 0.02,
    description: 'Printed royal cards, luxury boxes, digital invite & courier',
  },
  {
    name: 'Transportation',
    icon: 'Car',
    defaultBudgetWeight: 0.03,
    description: 'Guest coaches, vintage doli car, airport & station cabs',
  },
  {
    name: 'Accommodation',
    icon: 'Hotel',
    defaultBudgetWeight: 0.03,
    description: 'Guest suites, hotel room blocks & hospitality hampers',
  },
  {
    name: 'Makeup & Beauty',
    icon: 'Sparkle',
    defaultBudgetWeight: 0.02,
    description: 'Bridal makeover, hairstyling, mehendi artists & grooming',
  },
  {
    name: 'Entertainment',
    icon: 'Music',
    defaultBudgetWeight: 0.02,
    description: 'Dholak beats, DJ sound system, choreographers & folk artists',
  },
  {
    name: 'Gifts',
    icon: 'Gift',
    defaultBudgetWeight: 0.01,
    description: 'Return gifts, shagun envelopes, silver coins & mithai boxes',
  },
  {
    name: 'Rituals',
    icon: 'Heart',
    defaultBudgetWeight: 0.005,
    description: 'Puja samagri, havan items, coconut, sindoor & priest dakshina',
  },
  {
    name: 'Miscellaneous',
    icon: 'MoreHorizontal',
    defaultBudgetWeight: 0.005,
    description: 'Tips, emergency buffer, stationery & unforeseen advances',
  },
];

export const CATEGORY_NAMES = WEDDING_CATEGORIES.map((c) => c.name);

export function getCategoryDefinition(name: string): CategoryDefinition {
  const found = WEDDING_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return (
    found || {
      name,
      icon: 'Tag',
      defaultBudgetWeight: 0.01,
      description: 'Wedding celebration expense',
    }
  );
}
