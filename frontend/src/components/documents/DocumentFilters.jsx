import React from 'react';
import { ArrowUpDown, Calendar, Filter, Folder, RotateCcw, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const selectClass = "h-9 rounded-xl border border-transparent bg-transparent pl-8 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100 focus:border-indigo-500 focus:bg-slate-50 focus:ring-2 focus:ring-indigo-500/10 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:focus:bg-slate-900/60";

export const DocumentFilters = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
  folder,
  onFolderChange,
  folders = [],
  sortOrder,
  onSortOrderChange,
  categories = [],
  onReset,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-card border border-border/80 dark:bg-card/45 dark:backdrop-blur-xl p-2 rounded-2xl shadow-sm transition-colors">
      <div className="flex-1 w-full md:w-auto min-w-[250px]">
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search documents by name, type, or category..."
          leftIcon={Search}
          className="bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
        />
      </div>

      <div className="hidden md:block w-px h-8 bg-border mx-2"></div>

      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        <label className="relative flex-shrink-0">
          <Filter className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="relative flex-shrink-0">
          <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value)}
            className={selectClass}
            aria-label="Filter by upload date"
          >
            <option value="all">Any date</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>

        <label className="relative flex-shrink-0">
          <Folder className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={folder}
            onChange={(event) => onFolderChange(event.target.value)}
            className={selectClass}
            aria-label="Filter by folder"
          >
            <option value="all">All folders</option>
            <option value="unassigned">Unassigned</option>
            {folders.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="relative flex-shrink-0">
          <ArrowUpDown className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value)}
            className={selectClass}
            aria-label="Sort documents"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A-Z</option>
            <option value="size">Largest</option>
          </select>
        </label>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={RotateCcw}
          onClick={onReset}
          className="whitespace-nowrap"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
