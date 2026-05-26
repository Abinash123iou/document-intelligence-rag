import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon,
  colorClass = 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20'
}) => {
  const isPositive = trend === 'up' || (typeof change === 'number' && change > 0);
  const isNegative = trend === 'down' || (typeof change === 'number' && change < 0);
  const isNeutral = !isPositive && !isNegative;

  return (
    <Card padding="md" hoverEffect={true} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={cn("p-2.5 rounded-xl flex items-center justify-center", colorClass)}>
          {Icon && (
            typeof Icon === 'string' 
              ? <img src={Icon} alt={title} className="w-5 h-5 object-contain" /> 
              : <Icon size={20} />
          )}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </h3>
        
        {change !== undefined && (
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
            isPositive ? "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "",
            isNegative ? "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20" : "",
            isNeutral ? "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700" : ""
          )}>
            {isPositive && <TrendingUp size={12} className="mr-1" />}
            {isNegative && <TrendingDown size={12} className="mr-1" />}
            {isNeutral && typeof change === 'number' && <Minus size={12} className="mr-1" />}
            {change}{typeof change === 'number' ? '%' : ''}
          </div>
        )}
      </div>
    </Card>
  );
};
