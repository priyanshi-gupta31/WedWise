import { VendorCategory, VendorStatus, VendorDocumentType } from '../types/vendor';

export interface VendorCategoryConfig {
  name: VendorCategory;
  icon: string;
  description: string;
  defaultExpenseCategoryName: string;
}

export const VENDOR_CATEGORIES: VendorCategoryConfig[] = [
  {
    name: 'Venue',
    icon: 'Building',
    description: 'Palace resort, banquet hall, lawn, mandap & farmhouses',
    defaultExpenseCategoryName: 'Venue',
  },
  {
    name: 'Catering',
    icon: 'UtensilsCrossed',
    description: 'Royal banquet feasts, live food counters, sweets & high tea',
    defaultExpenseCategoryName: 'Catering',
  },
  {
    name: 'Decoration',
    icon: 'Sparkles',
    description: 'Floral mandap, fairy lights, stage styling & ambient torans',
    defaultExpenseCategoryName: 'Decoration',
  },
  {
    name: 'Photography',
    icon: 'Camera',
    description: 'Candid wedding photography, portrait albums & drone shoots',
    defaultExpenseCategoryName: 'Photography',
  },
  {
    name: 'Videography',
    icon: 'Video',
    description: 'Cinematic wedding film, teasers, reels & live streaming',
    defaultExpenseCategoryName: 'Videography',
  },
  {
    name: 'Makeup & Beauty',
    icon: 'Sparkle',
    description: 'Bridal makeovers, hairstyling, family grooming & draping',
    defaultExpenseCategoryName: 'Makeup',
  },
  {
    name: 'Mehendi',
    icon: 'Heart',
    description: 'Henna artists, bridal mehendi design & guest mehendi team',
    defaultExpenseCategoryName: 'Makeup',
  },
  {
    name: 'DJ / Music',
    icon: 'Music',
    description: 'DJ sound console, intelligent stage lighting, dhol & bass',
    defaultExpenseCategoryName: 'Entertainment',
  },
  {
    name: 'Choreography',
    icon: 'Users',
    description: 'Sangeet dance choreography, couple act & family routines',
    defaultExpenseCategoryName: 'Entertainment',
  },
  {
    name: 'Invitations & Printing',
    icon: 'Mail',
    description: 'Royal wedding cards, luxury boxes, digital invites & stationery',
    defaultExpenseCategoryName: 'Invitations',
  },
  {
    name: 'Jewellery',
    icon: 'Gem',
    description: 'Polki sets, diamond ornaments, gold rings & accessories',
    defaultExpenseCategoryName: 'Jewellery',
  },
  {
    name: 'Clothing',
    icon: 'Shirt',
    description: 'Bridal lehenga, groom sherwani, safa, stole & couture wear',
    defaultExpenseCategoryName: 'Clothing',
  },
  {
    name: 'Transportation',
    icon: 'Car',
    description: 'Vintage bridal doli car, guest shuttle buses & station cabs',
    defaultExpenseCategoryName: 'Transportation',
  },
  {
    name: 'Accommodation',
    icon: 'Hotel',
    description: 'Hotel room blocks, luxury suites & hospitality hampers',
    defaultExpenseCategoryName: 'Accommodation',
  },
  {
    name: 'Priest / Rituals',
    icon: 'Flame',
    description: 'Pandit ji dakshina, puja samagri, havan wood & sacred rituals',
    defaultExpenseCategoryName: 'Rituals',
  },
  {
    name: 'Entertainment',
    icon: 'Sparkles',
    description: 'Live band, folk performers, fireworks & entry grand production',
    defaultExpenseCategoryName: 'Entertainment',
  },
  {
    name: 'Other',
    icon: 'MoreHorizontal',
    description: 'Security, wedding planners, hampers, valet & miscellaneous',
    defaultExpenseCategoryName: 'Miscellaneous',
  },
];

export const VENDOR_STATUSES: {
  value: VendorStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  {
    value: 'Confirmed',
    label: 'Contract Confirmed',
    badgeBg: 'bg-[#EAF3EC]',
    badgeText: 'text-[#2D5A43]',
    badgeBorder: 'border-[#A9CEB5]',
  },
  {
    value: 'In Progress',
    label: 'Service in Progress',
    badgeBg: 'bg-[#FFF8E6]',
    badgeText: 'text-[#B88728]',
    badgeBorder: 'border-[#D6B36A]/50',
  },
  {
    value: 'Completed',
    label: 'Delivered & Completed',
    badgeBg: 'bg-[#FAF1F3]',
    badgeText: 'text-[#641F35]',
    badgeBorder: 'border-[#E8C5CD]',
  },
  {
    value: 'Negotiating',
    label: 'Under Negotiation',
    badgeBg: 'bg-[#FFF2E0]',
    badgeText: 'text-[#9E5D0A]',
    badgeBorder: 'border-[#E89838]/40',
  },
  {
    value: 'Contacted',
    label: 'Initial Contact',
    badgeBg: 'bg-[#FFFDF9]',
    badgeText: 'text-[#615163]',
    badgeBorder: 'border-[#E8DFD5]',
  },
  {
    value: 'Shortlisted',
    label: 'Shortlisted',
    badgeBg: 'bg-[#F4EFEA]',
    badgeText: 'text-[#8C7A8E]',
    badgeBorder: 'border-[#E8DFD5]',
  },
  {
    value: 'Cancelled',
    label: 'Cancelled / Released',
    badgeBg: 'bg-[#FFF0F0]',
    badgeText: 'text-[#C93B2B]',
    badgeBorder: 'border-[#F2B8B8]',
  },
];

export const VENDOR_DOCUMENT_TYPES: { value: VendorDocumentType; label: string }[] = [
  { value: 'Contract', label: 'Signed Contract / Agreement' },
  { value: 'Quotation', label: 'Quotation / Estimate' },
  { value: 'Invoice', label: 'Tax Invoice / Bill' },
  { value: 'Receipt', label: 'Official Receipt' },
  { value: 'Payment Proof', label: 'UPI / Bank Transfer Proof' },
  { value: 'Other', label: 'Other Document' },
];

export const VENDOR_PAYER_PRESETS = [
  'Dad',
  'Mom',
  'Bride',
  'Groom',
  'Sister',
  'Brother',
  'Uncle',
  'Family Pool',
];

export const VENDOR_PAYMENT_METHODS = [
  'UPI',
  'Bank Transfer',
  'Cash',
  'Card',
  'Other',
] as const;
