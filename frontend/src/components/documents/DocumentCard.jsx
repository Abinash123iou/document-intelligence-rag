import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Download,
  Eye,
  FileSearch,
  FolderInput,
  MessageSquare,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { FileIcon } from './FileIcon';

export const DocumentCard = ({
  id,
  apiId,
  title,
  category,
  size,
  date,
  type,
  status = 'processed',
  semanticScore,
  folder,
  onPreview,
  onDownload,
  onRename,
  onReclassify,
  onChat,
  onFindSimilar,
  onAssignFolder,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const documentPayload = { id, apiId, title, category, size, date, type, status, semanticScore, folder };

  const runAction = (action) => {
    setIsMenuOpen(false);
    action?.(documentPayload);
  };

  const menuItems = [
    { label: 'Preview', icon: Eye, action: onPreview },
    { label: 'Download', icon: Download, action: onDownload },
    { label: 'Rename', icon: Pencil, action: onRename },
    { label: 'Assign folder', icon: FolderInput, action: onAssignFolder },
    { label: 'Reclassify', icon: RefreshCw, action: onReclassify },
    { label: 'Chat with this', icon: MessageSquare, action: onChat },
    { label: 'Find similar', icon: FileSearch, action: onFindSimilar },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
  ];

  return (
    <Card padding="md" hoverEffect={true} className="group relative flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl border border-slate-100/80 bg-slate-50 p-3 shadow-sm transition-shadow group-hover:shadow dark:border-slate-800/40 dark:bg-slate-800/30">
          <FileIcon type={type} className="h-8 w-8" />
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            title="Document actions"
            className="rounded-lg p-1.5 text-slate-400 opacity-100 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:opacity-0 md:group-hover:opacity-100"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => runAction(item.action)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      item.danger
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                        : 'text-slate-650 hover:bg-slate-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-indigo-300'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex-1">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 dark:text-white" title={title}>
          {title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {folder && <Badge variant="blue">{folder}</Badge>}
          {category && <Badge variant="blue">{category}</Badge>}
          {semanticScore && (
            <Badge variant="purple" className="flex items-center gap-1">
              Score: {semanticScore}
            </Badge>
          )}
          {status === 'processing' && (
            <Badge variant="warning">Processing...</Badge>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{size}</span>
          <span>{date}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <button
            type="button"
            onClick={() => runAction(onPreview)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            title="Preview"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            onClick={() => runAction(onChat)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            title="Chat with this document"
          >
            <MessageSquare size={16} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            title="Delete"
            onClick={() => runAction(onDelete)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
};
