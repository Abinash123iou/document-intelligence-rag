import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

export const SuggestedQuestions = ({ questions, onSelect }) => {
  if (!questions || questions.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {questions.map((q, idx) => (
        <button 
          key={idx}
          onClick={() => onSelect && onSelect(q)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
        >
          <MessageSquarePlus size={14} />
          {q}
        </button>
      ))}
    </div>
  );
};
