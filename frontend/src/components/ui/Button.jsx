import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  disabled,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800/85 dark:hover:bg-slate-700/90 dark:text-white border border-slate-200/50 dark:border-slate-700/50 shadow-sm",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300",
  };
  
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && LeftIcon && <LeftIcon className={cn("mr-2", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />}
      {children}
      {!isLoading && RightIcon && <RightIcon className={cn("ml-2", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />}
    </button>
  );
});

Button.displayName = 'Button';
