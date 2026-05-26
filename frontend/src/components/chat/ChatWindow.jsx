import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Send, Paperclip, History, FileText, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { loadProfileSettings, PROFILE_STORAGE_KEY, PROFILE_UPDATED_EVENT } from '../../utils/profileSettings';

export const ChatWindow = ({ 
  messages, 
  onToggleHistory, 
  onToggleContext, 
  onSendMessage, 
  onAttachClick,
  isLoading,
  selectedDocIds = [],
  documentCount = 0,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [profile, setProfile] = useState(() => loadProfileSettings());
  const messagesEndRef = useRef(null);
  const starterPrompts = selectedDocIds.length > 0
    ? ['Summarize the selected document', 'Find the key risks and evidence', 'Compare answers across selected files']
    : ['Summarize my document base', 'Find the key risks and evidence', 'What documents should I review first?'];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      setProfile(event.detail || loadProfileSettings());
    };

    const handleStorage = (event) => {
      if (event.key === PROFILE_STORAGE_KEY) {
        setProfile(loadProfileSettings());
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-border overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-border bg-card/90 dark:bg-card/45 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onToggleHistory && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleHistory}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title="Toggle Chat History"
            >
              <History size={18} />
            </Button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Assistant
              {selectedDocIds.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-350 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/25">
                  <Database size={10} />
                  {selectedDocIds.length} doc{selectedDocIds.length > 1 ? 's' : ''} scoped
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Model: DocIntel v2</p>
          </div>
        </div>

        {onToggleContext && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleContext}
            className="xl:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5"
            title="Toggle Source Context"
          >
            <FileText size={18} />
            <span className="hidden sm:inline text-xs font-medium">Sources</span>
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-100 dark:ring-indigo-500/20 overflow-hidden">
              <img src="/Ai Image.png" alt="DocIntel AI" className="h-full w-full object-cover" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              I am the DocIntel RAG Assistant. How can I help you today?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2">
              Ask a question across all indexed files, or select specific documents from the left panel for a focused answer.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-2xl">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-slate-650 transition hover:border-indigo-500/30 hover:bg-indigo-50/60 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
              {selectedDocIds.length > 0
                ? `${selectedDocIds.length} of ${documentCount} documents selected`
                : documentCount > 0
                  ? `${documentCount} indexed document${documentCount === 1 ? '' : 's'} available`
                  : 'Upload documents to begin grounded RAG answers'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id}
              role={msg.role}
              content={msg.content}
              suggestions={msg.suggestions}
              onSelectSuggestion={(q) => onSendMessage(q)}
              profile={profile}
            />
          ))
        )}

        {/* Pulsing loading dots */}
        {isLoading && (
          <div className="flex w-full gap-4 flex-row">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <img src="/Ai Image.png" alt="AI" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
              <div className="px-4 py-3.5 rounded-2xl bg-card border border-border/80 rounded-tl-none flex items-center gap-1 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-2xl p-2 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10">
          <button
            type="button"
            onClick={onAttachClick}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
            title="Upload documents"
          >
            <Paperclip size={20} />
          </button>
          <textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask anything about your documents..."
            className="w-full max-h-32 min-h-[40px] bg-transparent border-0 resize-none focus:ring-0 text-sm py-2 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none disabled:opacity-60"
            rows={1}
          />
          <button 
            type="button"
            disabled={!inputValue.trim() || isLoading}
            onClick={handleSubmit}
            title="Send message"
            className="p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            AI responses can be inaccurate. Please verify citations.
          </p>
        </div>
      </div>
    </div>
  );
};
