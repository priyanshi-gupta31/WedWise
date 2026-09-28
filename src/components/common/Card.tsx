import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#FFFDF9] border border-[#E5DDD1] rounded-2xl p-5 sm:p-6 shadow-paper transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-card hover:border-[#C6A15B]/50 cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
