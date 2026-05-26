import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Card = React.forwardRef(({
  children,
  className,
  padding = 'md',
  hoverEffect = false,
  ...props
}, ref) => {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl transition-all duration-300 ease-out",
        // Consistent layout classes
        "bg-card border border-border/80 dark:bg-card/45 dark:backdrop-blur-xl shadow-sm",
        // Hover effect
        hoverEffect && "hover:shadow-md hover:border-slate-300 dark:hover:border-indigo-500/30 hover:-translate-y-0.5",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
