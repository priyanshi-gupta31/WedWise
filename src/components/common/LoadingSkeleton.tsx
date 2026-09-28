import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`bg-cream-200/70 animate-pulse rounded-lg ${className}`} />;
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header greeting */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Budget Summary Card */}
      <div className="bg-cream-100/70 border border-cream-200 rounded-3xl p-6 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-200">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-cream-100/70 border border-cream-200 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Recent expenses */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-cream-100/70 rounded-2xl">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
