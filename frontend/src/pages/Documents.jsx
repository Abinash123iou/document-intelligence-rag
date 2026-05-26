import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DocumentFilters } from '../components/documents/DocumentFilters';
import { DocumentGrid } from '../components/documents/DocumentGrid';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocuments,
  reclassifyDocument,
  renameDocument,
} from '../services/documentService';

const FOLDERS_STORAGE_KEY = 'docintel_document_folders_v1';
const FOLDER_ASSIGNMENTS_STORAGE_KEY = 'docintel_document_folder_assignments_v1';

const loadStoredJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key}:`, err);
    return fallback;
  }
};

const toDocumentCard = (doc, index = 0) => ({
  id: index + 1,
  apiId: doc.id,
  title: doc.filename,
  category: doc.category,
  size: doc.file_size_label,
  sizeBytes: doc.file_size_bytes,
  date: new Date(doc.uploaded_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
  uploadedAt: doc.uploaded_at,
  type: doc.file_type,
  status: doc.status,
  semanticScore: doc.semantic_score?.toFixed(2) || '0.95',
});

export const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [folders, setFolders] = useState(() => loadStoredJson(FOLDERS_STORAGE_KEY, []));
  const [folderAssignments, setFolderAssignments] = useState(() => loadStoredJson(FOLDER_ASSIGNMENTS_STORAGE_KEY, {}));
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const result = await getDocuments();
        if (result.success && result.data) {
          const transformedDocuments = result.data.map(toDocumentCard);
          setDocuments(transformedDocuments.map((doc) => ({
            ...doc,
            folder: loadStoredJson(FOLDER_ASSIGNMENTS_STORAGE_KEY, {})[doc.apiId] || '',
          })));
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, dateRange, folderFilter, sortOrder]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(FOLDER_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(folderAssignments));
  }, [folderAssignments]);

  const categories = Array.from(new Set(documents.map(doc => doc.category).filter(Boolean))).sort();

  const filteredDocuments = documents
    .filter((doc) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedSearch
        || doc.title.toLowerCase().includes(normalizedSearch)
        || doc.category?.toLowerCase().includes(normalizedSearch)
        || doc.type?.toLowerCase().includes(normalizedSearch);

      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesFolder = folderFilter === 'all'
        || (folderFilter === 'unassigned' ? !doc.folder : doc.folder === folderFilter);

      const uploadedTime = new Date(doc.uploadedAt).getTime();
      const matchesDate = dateRange === 'all'
        || uploadedTime >= Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;

      return matchesSearch && matchesCategory && matchesFolder && matchesDate;
    })
    .sort((a, b) => {
      if (sortOrder === 'oldest') {
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      }
      if (sortOrder === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortOrder === 'size') {
        return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      }
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIdx, startIdx + itemsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setDateRange('all');
    setFolderFilter('all');
    setSortOrder('newest');
  };

  const replaceDocument = (updatedDoc) => {
    setDocuments((prev) => prev.map((doc) => (
      doc.apiId === updatedDoc.id ? { ...toDocumentCard(updatedDoc, doc.id - 1), id: doc.id } : doc
    )));
    setPreviewDocument((current) => (
      current?.apiId === updatedDoc.id ? { ...toDocumentCard(updatedDoc, current.id - 1), id: current.id } : current
    ));
  };

  const handleDownloadDocument = (document) => {
    const link = window.document.createElement('a');
    link.href = getDocumentDownloadUrl(document.apiId);
    link.download = document.title;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleRenameDocument = async (document) => {
    const nextName = window.prompt('Rename document', document.title);
    if (!nextName || nextName.trim() === document.title) return;

    try {
      const updated = await renameDocument(document.apiId, nextName.trim());
      replaceDocument(updated);
    } catch (error) {
      console.error('Error renaming document:', error);
      alert(`Failed to rename document: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleReclassifyDocument = async (document) => {
    try {
      const result = await reclassifyDocument(document.apiId);
      replaceDocument(result.data);
    } catch (error) {
      console.error('Error reclassifying document:', error);
      alert(`Failed to reclassify document: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleChatWithDocument = (document) => {
    navigate('/chat', {
      state: {
        selectedDocumentIds: [document.apiId],
      },
    });
  };

  const handleFindSimilar = (document) => {
    navigate('/search', {
      state: {
        selectedDocumentIds: [document.apiId],
        query: document.title.replace(/\.[^.]+$/, ''),
        autoSearch: true,
      },
    });
  };

  const handleCreateFolder = () => {
    const folderName = window.prompt('New folder name');
    const normalized = folderName?.trim();
    if (!normalized) return;

    if (folders.some((folder) => folder.toLowerCase() === normalized.toLowerCase())) {
      alert('That folder already exists.');
      return;
    }

    setFolders((current) => [...current, normalized].sort());
    setFolderFilter(normalized);
  };

  const handleAssignFolder = (document) => {
    if (folders.length === 0) {
      const folderName = window.prompt('Create a folder for this document');
      const normalized = folderName?.trim();
      if (!normalized) return;
      setFolders((current) => Array.from(new Set([...current, normalized])).sort());
      setFolderAssignments((current) => ({ ...current, [document.apiId]: normalized }));
      setDocuments((current) => current.map((doc) => (
        doc.apiId === document.apiId ? { ...doc, folder: normalized } : doc
      )));
      return;
    }

    const currentFolder = document.folder || '';
    const choice = window.prompt(
      `Assign folder for "${document.title}"\nAvailable: ${folders.join(', ')}\nLeave blank to unassign.`,
      currentFolder
    );
    if (choice === null) return;

    const normalized = choice.trim();
    if (normalized && !folders.some((folder) => folder.toLowerCase() === normalized.toLowerCase())) {
      setFolders((current) => [...current, normalized].sort());
    }

    setFolderAssignments((current) => {
      const next = { ...current };
      if (normalized) {
        next[document.apiId] = normalized;
      } else {
        delete next[document.apiId];
      }
      return next;
    });
    setDocuments((current) => current.map((doc) => (
      doc.apiId === document.apiId ? { ...doc, folder: normalized } : doc
    )));
  };

  const handleDeleteDocument = async (documentOrId) => {
    try {
      const documentToDelete = typeof documentOrId === 'object'
        ? documentOrId
        : documents.find(doc => doc.id === documentOrId);
      if (!documentToDelete || !documentToDelete.apiId) {
        alert('Could not find document ID');
        return;
      }
      if (!window.confirm(`Are you sure you want to delete "${documentToDelete.title}"?`)) {
        return;
      }
      
      await deleteDocument(documentToDelete.apiId);
      setDocuments((prev) => prev.filter((doc) => doc.apiId !== documentToDelete.apiId));
      setFolderAssignments((current) => {
        const next = { ...current };
        delete next[documentToDelete.apiId];
        return next;
      });
      if (previewDocument?.apiId === documentToDelete.apiId) {
        setPreviewDocument(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Library</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage, search, and analyze your uploaded files.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={FolderPlus} onClick={handleCreateFolder}>
            New Folder
          </Button>
          <Button variant="primary" leftIcon={Upload} onClick={() => navigate('/upload')}>
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <DocumentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        folder={folderFilter}
        onFolderChange={setFolderFilter}
        folders={folders}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        categories={categories}
        onReset={resetFilters}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Loading documents...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && documents.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No documents uploaded yet</p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No documents match the current filters</p>
        </div>
      )}

      {/* Document Grid */}
      {!loading && !error && filteredDocuments.length > 0 && (
        <div className="flex-1 pb-4">
          <DocumentGrid
            documents={paginatedDocuments}
            onPreview={setPreviewDocument}
            onDownload={handleDownloadDocument}
            onRename={handleRenameDocument}
            onReclassify={handleReclassifyDocument}
            onChat={handleChatWithDocument}
            onFindSimilar={handleFindSimilar}
            onAssignFolder={handleAssignFolder}
            onDelete={handleDeleteDocument}
          />
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredDocuments.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto pb-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{startIdx + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(startIdx + itemsPerPage, filteredDocuments.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredDocuments.length}</span> results
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            
            <div className="hidden sm:flex items-center gap-1">
              {Array.from(new Set([1, currentPage, totalPages])).sort((a, b) => a - b).map((page, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}

    </div>
  );
};
