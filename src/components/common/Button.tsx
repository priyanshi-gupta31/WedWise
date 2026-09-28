import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'wine' | 'coral' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] tracking-normal';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4.5 py-2.5 gap-2',
    lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] border border-[#641F35] shadow-wine hover:shadow-card font-semibold focus:ring-[#641F35]/40',
    coral: 'bg-[#E86A5B] hover:bg-[#D25545] text-white border border-[#E86A5B] shadow-coral hover:shadow-card font-semibold focus:ring-[#E86A5B]/40',
    secondary: 'bg-white hover:bg-[#FFF7ED] text-[#29202A] border border-[#F1E4D6] hover:border-[#D6B36A]/50 focus:ring-[#D6B36A]/40',
    outline: 'bg-transparent hover:bg-white text-[#29202A] border border-[#F1E4D6] hover:border-[#641F35] focus:ring-[#641F35]/40',
    wine: 'bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] border border-[#641F35] shadow-wine font-semibold focus:ring-[#641F35]/40',
    danger: 'bg-[#FAF1F3] hover:bg-[#F5E8EB] text-[#641F35] border border-[#E8C5CD] focus:ring-[#641F35]/40',
    ghost: 'bg-transparent hover:bg-[#FFF7ED] text-[#615163] hover:text-[#29202A] focus:ring-[#F1E4D6]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
