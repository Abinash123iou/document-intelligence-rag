import api from "./api";

export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await api.get("/dashboard/recent-activity");
  return response.data;
};

export const deleteRecentActivity = async (activityId) => {
  const response = await api.delete(`/dashboard/recent-activity/${activityId}`);
  return response.data;
};

export const getCategoryBreakdown = async () => {
  const response = await api.get("/dashboard/category-breakdown");
  return response.data;
};

export const getQueryTrends = async () => {
  const response = await api.get("/dashboard/query-trends");
  return response.data;
};
