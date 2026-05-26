import React, { useEffect, useMemo, useState } from 'react';
import { FileIcon } from '../documents/FileIcon';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { highlightText } from '../../utils/highlightText.jsx';

const cn = (...inputs) => twMerge(clsx(inputs));

export const SearchResults = ({ results, onSelectResult, selectedId, isLoading = false, hasSearched = false, query = '' }) => {
  const [activeTab, setActiveTab] = useState('all');
  const chunkCount = results.filter(result => result.type === 'chunk').length;
  const documentCount = results.filter(result => result.type === 'document').length;
  const showTabs = documentCount > 0 && chunkCount > 0;
  
  const tabs = useMemo(() => [
    { id: 'all', label: 'All Results', count: results.length },
    ...(documentCount > 0 ? [{ id: 'documents', label: 'Documents', count: documentCount }] : []),
    ...(chunkCount > 0 ? [{ id: 'chunks', label: 'Text Chunks', count: chunkCount }] : []),
  ], [chunkCount, documentCount, results.length]);

  useEffect(() => {
    if (!showTabs && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [activeTab, showTabs]);

  const visibleResults = results.filter(result => {
    if (!showTabs) return true;
    if (activeTab === 'documents') return result.type === 'document';
    if (activeTab === 'chunks') return result.type === 'chunk';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      
      <div className="border-b border-border px-4 pt-4">
        {showTabs ? (
          <div className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors border-b-2 outline-none",
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-2 py-0.5 px-2 rounded-full text-[10px]",
                  activeTab === tab.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                    : "bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Search Results</h3>
            <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              {results.length} {results.length === 1 ? 'chunk' : 'chunks'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Searching indexed document chunks...
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="h-full flex items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {hasSearched ? 'No matching chunks found.' : 'Enter a query to search your indexed documents.'}
          </div>
        ) : (
        <div className="space-y-1">
          {visibleResults.map(result => (
            <div 
              key={result.id}
              onClick={() => onSelectResult && onSelectResult(result)}
              className={cn(
                "p-3 rounded-xl cursor-pointer transition-all border outline-none",
                selectedId === result.id 
                  ? "bg-indigo-50/50 border-indigo-500/20 dark:bg-indigo-500/10 dark:border-indigo-500/30"
                  : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon type={result.fileType} fileName={result.filename || result.title} className="w-4 h-4 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {result.title}
                  </h4>
                </div>
                <Badge variant="blue" className="text-[10px] px-1.5 py-0 flex-shrink-0 border-0">
                  {result.score}
                </Badge>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                {highlightText(result.preview, query)}
              </p>
              
              <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {result.type === 'chunk' && result.page && <span>Page {result.page}</span>}
                {result.date && <span>{result.date}</span>}
                <span className="capitalize">{result.category}</span>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      
    </div>
  );
};
