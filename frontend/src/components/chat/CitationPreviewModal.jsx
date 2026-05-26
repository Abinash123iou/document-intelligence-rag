import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileIcon } from '../documents/FileIcon';
import { buildApiUrl, getDocumentHtml, getDocumentText } from '../../services/api';

export const CitationPreviewModal = ({ citation, onClose }) => {
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const documentId = citation?.document_id;
  const filename = citation?.filename || citation?.documentName || 'Document';
  const fileType = (citation?.file_type || '').toLowerCase();
  const isPdf = fileType === 'pdf';
  const usesHtmlPreview = fileType === 'docx';
  const usesTextPreview = fileType === 'txt';
  const score = typeof citation?.score === 'number'
    ? `${Math.round(citation.score * 100)}%`
    : citation?.score;
  const preview = citation?.chunk_text || citation?.preview || '';

  useEffect(() => {
    if (!documentId || (!usesHtmlPreview && !usesTextPreview)) return;

    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError('');
        setText('');
        setHtml('');

        if (usesHtmlPreview) {
          const data = await getDocumentHtml(documentId);
          setHtml(data.html || '<p>No formatted preview could be generated for this document.</p>');
        } else {
          const data = await getDocumentText(documentId);
          setText(data.text || 'No text could be extracted from this document.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load source preview.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [documentId, usesHtmlPreview, usesTextPreview]);

  if (!citation) return null;

  const handleDownload = () => {
    if (!documentId) return;
    const link = document.createElement('a');
    link.href = buildApiUrl(`/documents/${documentId}/download`);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-slate-50/80 px-4 py-3 dark:bg-slate-900/70">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <FileIcon fileName={filename} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={filename}>
                {filename}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(fileType || 'file').toUpperCase()} source {citation.page ? `/ Page ${citation.page}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={Download} onClick={handleDownload} disabled={!documentId}>
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

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 bg-slate-100 dark:bg-slate-950/40">
            {documentId && isPdf ? (
              <iframe
                title={`Source preview ${filename}`}
                src={buildApiUrl(`/documents/${documentId}/view`)}
                className="h-full w-full border-0 bg-white"
              />
            ) : documentId && (usesHtmlPreview || usesTextPreview) ? (
              <div className="h-full overflow-y-auto bg-white p-5 dark:bg-slate-950">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading source preview...
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
                Source preview is not available for this citation.
              </div>
            )}
          </div>

          <aside className="min-h-0 overflow-y-auto border-t border-border bg-card p-5 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cited Chunk
              </h4>
              {score && (
                <Badge variant="purple" className="border-0">
                  {score} Match
                </Badge>
              )}
            </div>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-350">
              {preview}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};
