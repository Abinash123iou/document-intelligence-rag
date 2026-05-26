import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { UploadBox } from '../components/dashboard/UploadBox';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Upload = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Documents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add PDFs, DOCX files, or TXT files to extract text, classify content, and index searchable chunks.
          </p>
        </div>
        <Button variant="secondary" rightIcon={ArrowRight} onClick={() => navigate('/documents')}>
          View Library
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[430px]">
          <UploadBox onUploadComplete={() => {}} />
        </div>

        <div className="space-y-4">
          <Card padding="lg">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Processing Pipeline</h2>
            <div className="space-y-4">
              {[
                ['Extract text', '/Extract Txt.png', 'Read document content from PDF, DOCX, or TXT files.'],
                ['Classify document', '/Classify Document.png', 'Detect categories like report, resume, or research paper.'],
                ['Index chunks', '/Index chunks.png', 'Create embeddings so semantic search and chat can retrieve context.'],
                ['Manage library', '/Mangae Library.png', 'Preview, rename, reclassify, download, or delete files.'],
              ].map(([title, iconSrc, description]) => (
                <div key={title} className="flex gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 p-2 dark:bg-indigo-500/10">
                    <img src={iconSrc} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Supported Files</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              PDF, DOCX, and TXT files up to 50MB are accepted by the uploader.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
