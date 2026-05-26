import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatWindow } from '../components/chat/ChatWindow';
import { CitationCard } from '../components/chat/CitationCard';
import { CitationPreviewModal } from '../components/chat/CitationPreviewModal';
import { FileText, Plus, MessageSquare, Database, Trash2, X, Search, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getDocuments } from '../services/documentService';
import { ragQuery } from '../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const CHAT_STORAGE_KEY = 'docintel_chat_threads_v2';
const MESSAGE_STORAGE_KEY = 'docintel_chats_v2';

const createInitialThread = () => ({
  id: `thread_${Date.now()}`,
  title: 'New Chat Thread',
  date: 'Today',
  active: true
});

const loadStoredJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`Failed to load stored chat data for ${key}:`, err);
    return fallback;
  }
};

export const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [docFilter, setDocFilter] = useState('');
  const [previewCitation, setPreviewCitation] = useState(null);

  // Store only real chat history created from backend RAG responses.
  const [threads, setThreads] = useState(() => {
    const savedThreads = loadStoredJson(CHAT_STORAGE_KEY, []);
    if (Array.isArray(savedThreads) && savedThreads.length > 0) {
      const hasActiveThread = savedThreads.some(thread => thread.active);
      return hasActiveThread
        ? savedThreads
        : savedThreads.map((thread, index) => ({ ...thread, active: index === 0 }));
    }
    return [createInitialThread()];
  });

  const [chats, setChats] = useState(() => {
    const savedChats = loadStoredJson(MESSAGE_STORAGE_KEY, {});
    return savedChats && typeof savedChats === 'object' && !Array.isArray(savedChats)
      ? savedChats
      : {};
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  // Fetch documents for the checkbox list scoping
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await getDocuments();
        if (response.success && response.data) {
          // Keep API IDs directly
          setAvailableDocs(response.data);
        }
      } catch (err) {
        console.error("Failed to load documents for chat scoping:", err);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const incomingIds = location.state?.selectedDocumentIds;
    if (Array.isArray(incomingIds) && incomingIds.length > 0) {
      setSelectedDocIds(incomingIds);
    }
  }, [location.state]);

  const activeThread = threads.find(t => t.active) || threads[0];
  const activeMessages = activeThread ? chats[activeThread.id] || [] : [];

  // Sources to display in the Right Sidebar (from the last assistant message)
  const assistantMessages = activeMessages.filter(m => m.role === 'assistant');
  const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];
  const activeCitations = latestAssistantMessage?.sources || [];
  const filteredDocs = availableDocs.filter(doc =>
    doc.filename.toLowerCase().includes(docFilter.trim().toLowerCase())
    || doc.category?.toLowerCase().includes(docFilter.trim().toLowerCase())
  );
  const allFilteredSelected = filteredDocs.length > 0 && filteredDocs.every(doc => selectedDocIds.includes(doc.id));

  const handleNewChat = () => {
    const newId = `thread_${Date.now()}`;
    const newThread = {
      id: newId,
      title: 'New Chat Thread',
      date: 'Today',
      active: true
    };
    setThreads(prev => prev.map(t => ({ ...t, active: false })).concat(newThread));
    setChats(prev => ({ ...prev, [newId]: [] }));
    setShowHistory(false);
  };

  const handleSelectThread = (threadId) => {
    setThreads(prev => prev.map(t => ({
      ...t,
      active: t.id === threadId
    })));
    setShowHistory(false);
  };

  const handleDeleteThread = (threadId) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread || !window.confirm(`Delete "${thread.title}"?`)) return;

    setThreads(prev => {
      const remaining = prev.filter(t => t.id !== threadId);
      if (remaining.length === 0) {
        return [createInitialThread()];
      }
      if (thread.active) {
        return remaining.map((item, index) => ({ ...item, active: index === 0 }));
      }
      return remaining;
    });

    setChats(prev => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });
  };

  const handleSendMessage = async (text) => {
    if (!activeThread) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text
    };

    // Add user message immediately
    setChats(prev => ({
      ...prev,
      [activeThread.id]: [...(prev[activeThread.id] || []), userMsg]
    }));

    // Update thread title if it was a default title
    if (activeThread.title === 'New Chat Thread') {
      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            title: text.length > 25 ? text.substring(0, 25) + '...' : text
          };
        }
        return t;
      }));
    }

    setIsLoading(true);

    try {
      const data = await ragQuery(text, selectedDocIds);

      const assistantMsg = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || []
      };

      setChats(prev => ({
        ...prev,
        [activeThread.id]: [...(prev[activeThread.id] || []), assistantMsg]
      }));
    } catch (err) {
      console.error("RAG Query failed:", err);
      const errorMsg = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error answering your question. Please check that the server is running and your Groq API key is valid.\n\nDetails: ${err.response?.data?.detail || err.message}`
      };
      setChats(prev => ({
        ...prev,
        [activeThread.id]: [...(prev[activeThread.id] || []), errorMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDocScope = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const handleToggleAllFilteredDocs = () => {
    const filteredIds = filteredDocs.map(doc => doc.id);
    setSelectedDocIds(prev => {
      if (allFilteredSelected) {
        return prev.filter(id => !filteredIds.includes(id));
      }
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] flex flex-row gap-4 md:gap-6 min-h-0 relative">
      
      {/* Left Panel: Chat History & Scoping */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-card border-r border-border overflow-hidden shadow-xl transition-transform duration-300 ease-in-out",
        "lg:static lg:z-0 lg:translate-x-0 lg:flex lg:shadow-sm lg:rounded-2xl lg:border",
        showHistory ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* New Chat Button */}
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
          <Button variant="primary" className="w-full" leftIcon={Plus} onClick={handleNewChat}>
            New Chat
          </Button>
        </div>

        {/* Thread History list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-card">
          <div className="px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent Chats
          </div>
          {threads.map(thread => (
            <div
              key={thread.id}
              className={cn(
                "group flex items-start gap-1 rounded-xl transition-colors",
                thread.active
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-350'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectThread(thread.id)}
                className="min-w-0 flex-1 flex flex-col items-start px-3 py-2.5 text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <MessageSquare size={14} className="flex-shrink-0 opacity-70" />
                  <span className="text-sm font-medium truncate">{thread.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pl-6">{thread.date}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteThread(thread.id)}
                className="mr-1 mt-2 p-1.5 rounded-lg text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition"
                title="Delete chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Scope Context: Target Document Checklist */}
        <div className="border-t border-border p-4 bg-slate-50/20 dark:bg-slate-900/10">
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={12} className="text-indigo-500" />
              Query Document Scope
            </div>
            <p className="mt-1 text-[11px] text-slate-450 dark:text-slate-500">
              {selectedDocIds.length > 0
                ? `${selectedDocIds.length} selected for focused RAG`
                : 'No scope selected. Chat searches all indexed files.'}
            </p>
          </div>
          {availableDocs.length === 0 ? (
            <div className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal">
              No files indexed. Upload documents to scope context, or query globally.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={docFilter}
                  onChange={(event) => setDocFilter(event.target.value)}
                  placeholder="Filter documents..."
                  className="h-9 w-full rounded-xl border border-border bg-card pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllFilteredDocs}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  <CheckSquare size={12} />
                  {allFilteredSelected ? 'Unselect shown' : 'Select shown'}
                </button>
                {selectedDocIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDocIds([])}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredDocs.length === 0 && (
                  <p className="px-2 py-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    No documents match this filter.
                  </p>
                )}
                {filteredDocs.map(doc => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <label 
                      key={doc.id}
                      className="flex items-start gap-2 px-2 py-2 rounded-xl border border-transparent hover:border-indigo-500/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer text-xs transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleDocScope(doc.id)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-700 dark:text-slate-250" title={doc.filename}>
                          {doc.filename}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500">
                          {doc.category || 'Uncategorized'} / {doc.file_size_label || 'Indexed'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Chat Window */}
      <div className="flex-1 min-w-0 h-full">
        <ChatWindow 
          messages={activeMessages} 
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          selectedDocIds={selectedDocIds}
          documentCount={availableDocs.length}
          onToggleHistory={() => {
            setShowHistory(!showHistory);
            setShowContext(false);
          }}
          onToggleContext={() => {
            setShowContext(!showContext);
            setShowHistory(false);
          }}
          onAttachClick={() => navigate('/upload')}
        />
      </div>

      {/* Right Panel: Citations & Context */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-20 flex flex-col w-80 bg-card border-l border-border overflow-hidden shadow-xl transition-transform duration-300 ease-in-out",
        "xl:static xl:z-0 xl:translate-x-0 xl:flex xl:shadow-sm xl:rounded-2xl xl:border",
        showContext ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />
            Source Context
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeCitations.length} citation{activeCitations.length === 1 ? '' : 's'} found for this response
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
          {activeCitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FileText size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No citations available. Ask a question to view document sources.
              </p>
            </div>
          ) : (
            activeCitations.map((citation, idx) => (
              <CitationCard 
                key={idx} 
                documentName={citation.filename || citation.documentName || "Document"} 
                pageNumber={citation.page || citation.pageNumber || 1}
                score={typeof citation.score === 'number' ? `${Math.round(citation.score * 100)}%` : citation.score}
                preview={citation.chunk_text || citation.preview}
                onClick={() => setPreviewCitation(citation)}
              />
            ))
          )}
        </div>
      </div>

      {/* Mobile backdrops for responsive drawers */}
      {(showHistory || showContext) && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => {
            setShowHistory(false);
            setShowContext(false);
          }}
        />
      )}

      {previewCitation && (
        <CitationPreviewModal
          citation={previewCitation}
          onClose={() => setPreviewCitation(null)}
        />
      )}

    </div>
  );
};
