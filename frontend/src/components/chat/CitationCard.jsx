import React from 'react';
import { ChevronRight } from 'lucide-react';
import { FileIcon } from '../documents/FileIcon';
import { Badge } from '../ui/Badge';

export const CitationCard = ({ documentName, pageNumber, preview, score, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-border/80 bg-card p-3 text-left shadow-sm transition-all duration-200 hover:border-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:border-indigo-500/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon fileName={documentName} className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {documentName}
          </span>
        </div>
        {score && (
          <Badge variant="blue" className="text-[10px] px-1.5 py-0 border-0">
            {score}
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mt-1">
        "{preview}"
      </p>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-500">
          Page {pageNumber}
        </span>
        <div className="flex items-center text-[10px] font-medium text-indigo-600 dark:text-indigo-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          View Source <ChevronRight size={12} className="ml-0.5" />
        </div>
      </div>
    </button>
  );
};
