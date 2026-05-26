import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Badge = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
    error: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border border-transparent",
        "dark:border-current/10", // Adds subtle border matching text color in dark mode
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
