import React from 'react';
import { DocumentCard } from './DocumentCard';

export const DocumentGrid = ({
  documents = [],
  onPreview,
  onDownload,
  onRename,
  onReclassify,
  onChat,
  onFindSimilar,
  onAssignFolder,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {documents.map((doc) => (
        <DocumentCard 
          key={doc.id} 
          id={doc.id}
          apiId={doc.apiId}
          title={doc.title}
          category={doc.category}
          size={doc.size}
          date={doc.date}
          type={doc.type}
          status={doc.status}
          semanticScore={doc.semanticScore}
          folder={doc.folder}
          onPreview={onPreview}
          onDownload={onDownload}
          onRename={onRename}
          onReclassify={onReclassify}
          onChat={onChat}
          onFindSimilar={onFindSimilar}
          onAssignFolder={onAssignFolder}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
