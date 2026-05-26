import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || React.useId();
  
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm transition-colors shadow-sm",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500" 
              : "border-slate-200 dark:border-slate-800/80",
            LeftIcon && "pl-10",
            RightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <RightIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={cn("text-xs", error ? "text-red-500" : "text-slate-500 dark:text-slate-400")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
