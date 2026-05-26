import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const SearchBar = ({ value, onChange, onSearch, isLoading = false, className }) => {
  const isSearchDisabled = isLoading || !value?.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full group", className)}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={20} className="text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Search documents, entities, or concepts..." 
        className="block w-full pl-12 pr-[100px] sm:pr-[160px] py-4 border border-border rounded-2xl leading-5 bg-card text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 text-base transition-all shadow-sm"
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded-md border border-border shadow-sm">
          <span>⌘</span>
          <span>K</span>
        </div>
        <button 
          type="submit"
          disabled={isSearchDisabled}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isLoading ? 'Searching' : 'Search'}
        </button>
      </div>
    </form>
  );
};
