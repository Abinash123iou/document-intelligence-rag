import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileIcon } from './FileIcon';
import { getDocumentDownloadUrl, getDocumentPreviewHtml, getDocumentPreviewText, getDocumentViewUrl } from '../../services/documentService';

export const DocumentPreviewModal = ({ document, onClose }) => {
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileType = (document?.type || '').toLowerCase();
  const isPdf = fileType === 'pdf';
  const usesHtmlPreview = fileType === 'docx';
  const usesTextPreview = fileType === 'txt';

  useEffect(() => {
    if (!document?.apiId || (!usesHtmlPreview && !usesTextPreview)) return;

    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError('');
        setText('');
        setHtml('');

        if (usesHtmlPreview) {
          const data = await getDocumentPreviewHtml(document.apiId);
          setHtml(data.html || '<p>No formatted preview could be generated for this document.</p>');
        } else {
          const data = await getDocumentPreviewText(document.apiId);
          setText(data.text || 'No text could be extracted from this document.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load document preview.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [document?.apiId, usesHtmlPreview, usesTextPreview]);

  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = getDocumentDownloadUrl(document.apiId);
    link.download = document.title;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-slate-50/80 px-4 py-3 dark:bg-slate-900/70">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <FileIcon type={document.type} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={document.title}>
                {document.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(document.type || 'file').toUpperCase()} / {document.category || 'Uncategorized'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={Download} onClick={handleDownload}>
              Download
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950/40">
          {isPdf ? (
            <iframe
              title={`Preview ${document.title}`}
              src={getDocumentViewUrl(document.apiId)}
              className="h-full w-full border-0 bg-white"
            />
          ) : usesHtmlPreview || usesTextPreview ? (
            <div className="h-full overflow-y-auto bg-white p-5 dark:bg-slate-950">
              {isLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preview...
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : usesHtmlPreview ? (
                <article
                  className="docx-preview"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700 dark:text-slate-250">
                  {text}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              Preview is not supported for this file type yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
