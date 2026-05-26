import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/50 dark:bg-slate-800/50",
        className
      )}
      {...props}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900/75 dark:border-slate-800/80 shadow-sm">
      <Skeleton className="h-6 w-1/3 mb-4 rounded-lg" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-6" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
};

export const ListItemSkeleton = () => {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
      <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
    </div>
  );
};

export const TextBlockSkeleton = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === lines - 1 ? "w-4/5" : "w-full")} 
        />
      ))}
    </div>
  );
};

// Main Loader export
export const Loader = {
  Skeleton,
  Card: CardSkeleton,
  ListItem: ListItemSkeleton,
  TextBlock: TextBlockSkeleton
};
