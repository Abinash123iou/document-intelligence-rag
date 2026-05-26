import React from 'react';
import { SuggestedQuestions } from './SuggestedQuestions';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const MessageBubble = ({ role, content, suggestions, onSelectSuggestion, profile }) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      "flex w-full gap-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {isUser ? (
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <img src="/Ai Image.png" alt="AI" className="w-full h-full object-cover" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[85%] sm:max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser 
            ? "bg-indigo-600 text-white rounded-tr-none shadow-md" 
            : "bg-card border border-border/80 text-slate-850 dark:text-slate-100 rounded-tl-none"
        )}>
          {/* Simple mapping for paragraphs */}
          {content.split('\n').map((paragraph, i) => (
            <p key={i} className={i > 0 && paragraph.trim() !== '' ? "mt-2" : ""}>
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* Suggested Follow-ups */}
        {!isUser && suggestions && (
          <SuggestedQuestions questions={suggestions} onSelect={onSelectSuggestion} />
        )}
      </div>
    </div>
  );
};
