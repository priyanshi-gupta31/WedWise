import React from 'react';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBadgeProps {
  name: string;
  icon?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  name,
  icon,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-[#FAF8F5] text-[#262421] border border-[#E9E1D7] ${sizeClasses} ${className}`}
    >
      <CategoryIcon categoryName={name} nameOrIcon={icon} className={`${iconSize} text-[#C9A45C]`} />
      <span>{name}</span>
    </span>
  );
};

export const PaymentMethodBadge: React.FC<{ method: string; size?: 'sm' | 'md' }> = ({ method, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-md bg-[#F2EFEB] text-[#4A4641] font-medium ${sizeClass}`}>
      {method}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: 'Paid' | 'Pending'; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const isPaid = status === 'Paid';
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${
        isPaid
          ? 'bg-[#EDF2EE] text-[#476850] border-[#D0DED3]'
          : 'bg-[#FAF5EA] text-[#8E6F30] border-[#E7D3A3]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPaid ? 'bg-[#5B8266]' : 'bg-[#C9A45C]'}`} />
      {status}
    </span>
  );
};
