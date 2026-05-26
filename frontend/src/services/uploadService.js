// src/services/uploadService.js
import api from "./api";

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload-document", formData);

  return response.data;
};
