// src/services/documentService.js
import api from "./api";
import { buildApiUrl, getDocumentHtml, getDocumentText } from "./api";

export const getDocuments = async () => {
  const response = await api.get("/documents");
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

export const renameDocument = async (documentId, filename) => {
  const response = await api.patch(`/documents/${documentId}/rename`, { filename });
  return response.data;
};

export const reclassifyDocument = async (documentId) => {
  const response = await api.post(`/documents/${documentId}/reclassify`);
  return response.data;
};

export const reclassifyAllDocuments = async () => {
  const response = await api.post("/documents/reclassify-all");
  return response.data;
};

export const getDocumentPreviewText = getDocumentText;

export const getDocumentPreviewHtml = getDocumentHtml;

export const getDocumentViewUrl = (documentId) => buildApiUrl(`/documents/${documentId}/view`);

export const getDocumentDownloadUrl = (documentId) => buildApiUrl(`/documents/${documentId}/download`);

