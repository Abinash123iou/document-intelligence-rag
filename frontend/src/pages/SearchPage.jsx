import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults } from '../components/search/SearchResults';
import { ChunkPreview } from '../components/search/ChunkPreview';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { semanticSearch } from '../services/api';

const cn = (...inputs) => twMerge(clsx(inputs));

const formatScore = (score) => `${Math.round((score || 0) * 100)}%`;
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const inferFileType = (filename = '', fallback = 'unknown') => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return fallback;
  return filename.slice(lastDot + 1).toLowerCase() || fallback;
};

const toSearchResult = (result, index) => ({
  id: result.document_id ? `${result.document_id}-${result.page || 0}-${index}` : `result-${index}`,
  documentId: result.document_id || null,
  type: 'chunk',
  rank: result.rank,
  title: result.title || result.filename || 'Untitled',
  filename: result.filename || result.title || 'Untitled',
  fileType: result.file_type || inferFileType(result.filename || ''),
  preview: result.snippet || '',
  fullContent: result.snippet || '',
  rawScore: result.score || 0,
  score: formatScore(result.score),
  page: result.page,
  category: result.category || 'Document',
});

export const SearchPage = () => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [scopedDocumentIds, setScopedDocumentIds] = useState(null);
  const [shouldRunIncomingSearch, setShouldRunIncomingSearch] = useState(false);

  useEffect(() => {
    const incomingIds = location.state?.selectedDocumentIds;
    if (Array.isArray(incomingIds) && incomingIds.length > 0) {
      setScopedDocumentIds(incomingIds);
    } else {
      setScopedDocumentIds(null);
    }
    if (typeof location.state?.query === 'string') {
      setQuery(location.state.query);
    }
    if (location.state?.autoSearch) {
      setShouldRunIncomingSearch(true);
    }
  }, [location.state]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Enter a search query to run semantic search.');
      setResults([]);
      setSelectedResult(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setLastQuery(trimmedQuery);

    try {
      const data = await semanticSearch(trimmedQuery, 25, scopedDocumentIds);
      // Handle the new response format with results array
      const resultsArray = data.results || [];
      const nextResults = resultsArray.map((result, idx) => {
        try {
          return toSearchResult(result, idx);
        } catch (err) {
          console.error('Error mapping result:', result, err);
          throw err;
        }
      });
      setResults(nextResults);
      setSelectedResult(nextResults[0] || null);
      setIsMobilePreviewOpen(false);
    } catch (searchError) {
      console.error('Search error:', searchError);
      setResults([]);
      setSelectedResult(null);
      setError(searchError.response?.data?.detail || searchError.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!shouldRunIncomingSearch || !query.trim()) return;
    setShouldRunIncomingSearch(false);
    handleSearch();
  }, [query, shouldRunIncomingSearch]);

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col min-h-0 space-y-4">
      
      {/* Top Search Area */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Semantic Search</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search across your entire document base using natural language.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 md:gap-6 pt-2">
        
        {/* Left Side: Results List */}
        <div className={cn(
          "flex-1 lg:max-w-md xl:max-w-lg h-full",
          isMobilePreviewOpen ? "hidden lg:block" : "block"
        )}>
          <SearchResults 
            results={results}
            selectedId={selectedResult?.id}
            isLoading={isLoading}
            hasSearched={hasSearched}
            query={lastQuery}
            onSelectResult={(result) => {
              setSelectedResult(result);
              setIsMobilePreviewOpen(true);
            }}
          />
        </div>

        {/* Right Side: Chunk Preview */}
        <div className={cn(
          "flex-1 h-full",
          isMobilePreviewOpen ? "block" : "hidden lg:block"
        )}>
          {selectedResult ? (
            <ChunkPreview 
              documentId={selectedResult.documentId}
              documentName={selectedResult.filename}
              fileType={selectedResult.fileType}
              pageNumber={selectedResult.page}
              content={selectedResult.fullContent}
              score={selectedResult.score}
              date={selectedResult.date}
              query={lastQuery}
              onClose={() => setIsMobilePreviewOpen(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-card rounded-2xl border border-border">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Select a result to preview</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
