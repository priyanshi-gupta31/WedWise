import React from 'react';

interface ProgressBarProps {
  percentage: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showText = false,
  size = 'md',
  label,
  className = '',
}) => {
  const visualWidth = Math.min(Math.max(percentage, 0), 100);

  // Status colors with muted sage green, champagne gold, and soft rose
  let barColor = 'bg-[#5B8266]'; // Muted sage green
  let trackColor = 'bg-[#EDF2EE]';
  let statusText = 'Normal';
  let badgeStyle = 'text-[#476850] bg-[#EDF2EE] border-[#D0DED3]';

  if (percentage > 100) {
    barColor = 'bg-[#C96B61]';
    trackColor = 'bg-[#FDF2F0]';
    statusText = 'Over budget';
    badgeStyle = 'text-[#B84033] bg-[#FDF2F0] border-[#F7C9C2]';
  } else if (percentage >= 90) {
    barColor = 'bg-[#B08C44]';
    trackColor = 'bg-[#FAF5EA]';
    statusText = 'Allocated';
    badgeStyle = 'text-[#8E6F30] bg-[#FAF5EA] border-[#E7D3A3]';
  } else if (percentage >= 70) {
    barColor = 'bg-[#C9A45C]';
    trackColor = 'bg-[#FAF5EA]';
    statusText = 'Paced';
    badgeStyle = 'text-[#8E6F30] bg-[#FAF5EA] border-[#E7D3A3]';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[#77716A] font-medium">{label || 'Budget Used'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyle}`}>
              {statusText}
            </span>
          </div>
          <span className="text-[#262421] font-semibold">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}

      <div
        className={`w-full rounded-full overflow-hidden ${trackColor} ${heightClasses[size]} relative`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heightClasses[size]} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>
    </div>
  );
};
