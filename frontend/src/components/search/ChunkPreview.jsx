import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import { FileIcon } from '../documents/FileIcon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { highlightText } from '../../utils/highlightText.jsx';
import { buildApiUrl, getDocumentHtml, getDocumentText } from '../../services/api';

export const ChunkPreview = ({
  documentId,
  documentName,
  fileType = 'unknown',
  pageNumber,
  content,
  score,
  date,
  query = '',
  onClose,
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentHtml, setDocumentHtml] = useState('');
  const [viewerError, setViewerError] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);

  const normalizedFileType = (fileType || '').toLowerCase();
  const canPreview = Boolean(documentId);
  const isPdf = normalizedFileType === 'pdf';
  const usesHtmlPreview = normalizedFileType === 'docx';
  const usesTextPreview = normalizedFileType === 'txt';
  const metadataItems = [
    pageNumber ? `Page ${pageNumber}` : null,
    date ? `Modified ${date}` : null,
  ].filter(Boolean);

  const viewUrl = useMemo(() => (
    documentId ? buildApiUrl(`/documents/${documentId}/view`) : ''
  ), [documentId]);

  const downloadUrl = useMemo(() => (
    documentId ? buildApiUrl(`/documents/${documentId}/download`) : ''
  ), [documentId]);

  useEffect(() => {
    setIsViewerOpen(false);
    setDocumentText('');
    setDocumentHtml('');
    setViewerError('');
  }, [documentId]);

  useEffect(() => {
    if (!isViewerOpen || !documentId || (!usesHtmlPreview && !usesTextPreview)) return;
    if ((usesHtmlPreview && documentHtml) || (usesTextPreview && documentText)) return;

    const loadPreview = async () => {
      try {
        setIsTextLoading(true);
        setViewerError('');
        if (usesHtmlPreview) {
          const data = await getDocumentHtml(documentId);
          setDocumentHtml(data.html || '<p>No formatted preview could be generated for this document.</p>');
        } else {
          const data = await getDocumentText(documentId);
          setDocumentText(data.text || 'No text could be extracted from this document.');
        }
      } catch (error) {
        setViewerError(error.response?.data?.detail || 'Could not load document text preview.');
      } finally {
        setIsTextLoading(false);
      }
    };

    loadPreview();
  }, [documentHtml, documentId, documentText, isViewerOpen, usesHtmlPreview, usesTextPreview]);

  const handleDownload = () => {
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = documentName || 'document';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-slate-50/50 p-4 dark:bg-slate-900/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 lg:hidden"
                title="Back to search results"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex-shrink-0 rounded-xl bg-indigo-100/50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FileIcon type={normalizedFileType} fileName={documentName} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={documentName}>
                {documentName}
              </h3>
              {metadataItems.length > 0 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {metadataItems.join(' - ')}
                </p>
              )}
            </div>
          </div>
          <Badge variant="purple" className="flex-shrink-0 border-0">
            {score} Match
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Extracted Context
        </h4>
        <div className="prose prose-sm max-w-none leading-relaxed text-slate-700 dark:prose-invert dark:text-slate-350">
          <p>{highlightText(content, query)}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-slate-50/50 p-4 dark:bg-slate-900/20">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={Download}
          onClick={handleDownload}
          disabled={!canPreview}
          title={canPreview ? 'Download original document' : 'Document is not available for download'}
        >
          Download
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={ExternalLink}
          onClick={() => setIsViewerOpen(true)}
          disabled={!canPreview}
          title={canPreview ? 'Open document preview' : 'Document viewer is not available'}
        >
          Open Document
        </Button>
      </div>

      {isViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-border bg-slate-50/80 px-4 py-3 dark:bg-slate-900/70">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <FileIcon type={normalizedFileType} fileName={documentName} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={documentName}>
                    {documentName}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {normalizedFileType || 'document'} preview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" leftIcon={Download} onClick={handleDownload}>
                  Download
                </Button>
                <button
                  type="button"
                  onClick={() => setIsViewerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-0 bg-slate-100 dark:bg-slate-950/40">
                {isPdf ? (
                  <iframe
                    title={`Preview ${documentName}`}
                    src={viewUrl}
                    className="h-full w-full border-0 bg-white"
                  />
                ) : usesHtmlPreview || usesTextPreview ? (
                  <div className="h-full overflow-y-auto bg-white p-5 dark:bg-slate-950">
                    {isTextLoading ? (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading text preview...
                      </div>
                    ) : viewerError ? (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600 dark:text-red-400">
                        {viewerError}
                      </div>
                    ) : usesHtmlPreview ? (
                      <article
                        className="docx-preview"
                        dangerouslySetInnerHTML={{ __html: documentHtml }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700 dark:text-slate-250">
                        {documentText}
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

              <aside className="min-h-0 overflow-y-auto border-t border-border bg-card p-5 lg:border-l lg:border-t-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Matched Context
                  </h4>
                  <Badge variant="purple" className="border-0">
                    {score} Match
                  </Badge>
                </div>
                <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-350">
                  <p>{highlightText(content, query)}</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
