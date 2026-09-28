import React from 'react';
import {
  Building2,
  UtensilsCrossed,
  Sparkles,
  Camera,
  Video,
  Shirt,
  Gem,
  Sparkle,
  Music,
  Mail,
  Car,
  Hotel,
  Gift,
  MoreHorizontal,
  Tag,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  nameOrIcon?: string;
  categoryName?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  nameOrIcon = '',
  categoryName = '',
  className = 'w-5 h-5',
  ...props
}) => {
  const key = (categoryName || nameOrIcon).toLowerCase();

  if (key.includes('venue') || key.includes('building')) return <Building2 className={className} {...props} />;
  if (key.includes('cater') || key.includes('food') || key.includes('utensil')) return <UtensilsCrossed className={className} {...props} />;
  if (key.includes('decor') || key.includes('sparkles')) return <Sparkles className={className} {...props} />;
  if (key.includes('photo') || key.includes('camera')) return <Camera className={className} {...props} />;
  if (key.includes('video')) return <Video className={className} {...props} />;
  if (key.includes('cloth') || key.includes('dress') || key.includes('lehenga') || key.includes('shirt')) return <Shirt className={className} {...props} />;
  if (key.includes('jewel') || key.includes('gold') || key.includes('gem')) return <Gem className={className} {...props} />;
  if (key.includes('makeup') || key.includes('beauty') || key.includes('sparkle')) return <Sparkle className={className} {...props} />;
  if (key.includes('music') || key.includes('dj')) return <Music className={className} {...props} />;
  if (key.includes('invit') || key.includes('mail') || key.includes('card')) return <Mail className={className} {...props} />;
  if (key.includes('transport') || key.includes('car')) return <Car className={className} {...props} />;
  if (key.includes('accommodat') || key.includes('hotel') || key.includes('room')) return <Hotel className={className} {...props} />;
  if (key.includes('gift')) return <Gift className={className} {...props} />;
  if (key.includes('misc') || key.includes('other')) return <MoreHorizontal className={className} {...props} />;

  return <Tag className={className} {...props} />;
};
