import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <Skeleton className="hidden md:block h-12 w-96 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
