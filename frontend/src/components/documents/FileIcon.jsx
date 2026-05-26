import React from 'react';
import pdfIcon from '../../assets/pdf.png';
import docIcon from '../../assets/doc.png';
import txtIcon from '../../assets/txt.png';
import jsonIcon from '../../assets/json.png';

export const FileIcon = ({ type, fileName, className = "w-6 h-6", alt }) => {
  let fileType = type;
  
  if (!fileType && fileName) {
    fileType = fileName.split('.').pop()?.toLowerCase();
  } else if (fileType) {
    fileType = fileType.toLowerCase();
  }

  let iconSrc = docIcon; // default fallback
  switch (fileType) {
    case 'pdf':
      iconSrc = pdfIcon;
      break;
    case 'txt':
    case 'text':
      iconSrc = txtIcon;
      break;
    case 'doc':
    case 'docx':
      iconSrc = docIcon;
      break;
    case 'json':
      iconSrc = jsonIcon;
      break;
    default:
      iconSrc = docIcon;
  }

  return (
    <img 
      src={iconSrc} 
      alt={alt || `${fileType || 'document'} file`} 
      className={`object-contain drop-shadow-sm ${className}`} 
    />
  );
};
