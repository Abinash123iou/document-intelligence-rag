import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { uploadDocument } from '../../services/uploadService';

const formatUploadError = (error) => {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(' ');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return detail
    || (error.message === 'Network Error'
      ? 'Upload reached the server, but the browser could not read the response. Check CORS and restart the backend.'
      : error.message)
    || 'Upload failed.';
};

export const UploadBox = ({ onUploadComplete }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadStatus('uploading');
    setMessage('Uploading and processing...');

    try {
      const result = await uploadDocument(file);
      if (result.success) {
        setUploadStatus('success');
        setMessage(`Success! ${result.data.filename} processed.`);
        onUploadComplete?.();
      } else {
        setUploadStatus('error');
        setMessage(result.message || 'An unknown error occurred.');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage(formatUploadError(error));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const renderContent = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <>
            <div className="animate-spin">
              <UploadCloud className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">{message}</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">{message}</p>
            <Button onClick={() => setUploadStatus('idle')} className="mt-4">Upload Another</Button>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">{message}</p>
            <Button onClick={() => setUploadStatus('idle')} className="mt-4">Try Again</Button>
          </>
        );
      default:
        return (
          <>
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              {isDragActive ? 'Drop the file here...' : 'Click to upload or drag and drop'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              PDF, DOCX, or TXT (Max. 50MB)
            </p>
            <Button variant="secondary" size="md">
              Browse Files
            </Button>
          </>
        );
    }
  };

  return (
    <Card padding="none" className="w-full h-full min-h-[280px] overflow-hidden flex flex-col">
      <div
        {...getRootProps()}
        className="flex-1 m-3 border-2 border-dashed border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-6 bg-slate-50/30 dark:bg-slate-900/10 cursor-pointer group"
      >
        <input {...getInputProps()} />
        {renderContent()}
      </div>
    </Card>
  );
};
