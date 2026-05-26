import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const buildApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${path}`;
};

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

export const semanticSearch = async (query, topK = 5, documentIds = null) => {
  const payload = {
    query,
    top_k: topK,
  };
  if (documentIds && documentIds.length > 0) {
    payload.document_ids = documentIds;
  }
  const response = await api.post("/semantic-search", payload);
  return response.data;
};

export const ragQuery = async (query, documentIds = null, topK = 5) => {
  const payload = {
    query,
    top_k: topK,
  };
  if (documentIds && documentIds.length > 0) {
    payload.document_ids = documentIds;
  }
  const response = await api.post("/rag-query", payload);
  return response.data;
};

export const getDocumentText = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/text`);
  return response.data;
};

export const getDocumentHtml = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/html`);
  return response.data;
};

export default api;
