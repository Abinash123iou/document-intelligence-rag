import api from "./api";

export const getAnalyticsOverview = async (days = 30) => {
  const response = await api.get("/analytics/overview", { params: { days } });
  return response.data;
};

export const getTopDocuments = async (days = 30) => {
  const response = await api.get("/analytics/top-documents", { params: { days } });
  return response.data;
};

export const getAnalyticsQueryTrends = async (days = 7) => {
  const response = await api.get("/analytics/query-trends", { params: { days } });
  return response.data;
};
