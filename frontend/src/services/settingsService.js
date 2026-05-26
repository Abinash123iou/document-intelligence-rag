import api from "./api";

export const getLLMSettings = async () => {
  const response = await api.get("/settings/llm");
  return response.data;
};

export const updateLLMSettings = async (settings) => {
  const response = await api.put("/settings/llm", settings);
  return response.data;
};

export const getEmbeddingSettings = async () => {
  const response = await api.get("/settings/embedding");
  return response.data;
};

export const updateEmbeddingSettings = async (settings) => {
  const response = await api.put("/settings/embedding", settings);
  return response.data;
};

export const getVectorDBSettings = async () => {
  const response = await api.get("/settings/vector-db");
  return response.data;
};

export const updateVectorDBSettings = async (settings) => {
  const response = await api.put("/settings/vector-db", settings);
  return response.data;
};

export const reindexDocumentLibrary = async () => {
  const response = await api.post("/settings/maintenance/reindex");
  return response.data;
};

export const wipeVectorDatabase = async () => {
  const response = await api.post("/settings/maintenance/wipe");
  return response.data;
};
