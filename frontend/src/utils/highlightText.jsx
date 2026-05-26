import React from 'react';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getQueryTerms = (query = '') => {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to',
    'was', 'what', 'which', 'with'
  ]);

  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((term) => term.length > 1 && !stopWords.has(term))
    )
  );
};

export const highlightText = (text = '', query = '') => {
  const terms = getQueryTerms(query);
  if (!text || terms.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');

  return text.split(pattern).map((part, index) => {
    const isMatch = terms.includes(part.toLowerCase());
    if (!isMatch) return part;

    return (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-amber-200 px-0.5 text-slate-950 dark:bg-amber-400/30 dark:text-amber-100"
      >
        {part}
      </mark>
    );
  });
};
