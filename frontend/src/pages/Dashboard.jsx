import React, { useEffect, useState } from 'react';
import totalDocImg from '../assets/Total doc.png';
import vectorEmbedImg from '../assets/vector embedded.png';
import chatQueryImg from '../assets/Ai chat.png';

import { StatsCard } from '../components/dashboard/StatsCard';
import { UploadBox } from '../components/dashboard/UploadBox';
import { ActivityList } from '../components/dashboard/ActivityList';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import {
  getCategoryBreakdown,
  getDashboardSummary,
  getQueryTrends,
  getRecentActivity
} from '../services/dashboardService';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [summaryData, activityData, categoryData, trendData] = await Promise.all([
        getDashboardSummary(),
        getRecentActivity(),
        getCategoryBreakdown(),
        getQueryTrends(),
      ]);

      setSummary(summaryData);
      setActivities(activityData);
      setCategories(categoryData);
      setTrends(trendData);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      title: 'Total Documents',
      value: isLoading ? '...' : formatNumber(summary?.total_documents),
      change: 'live',
      trend: 'neutral',
      icon: totalDocImg,
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20'
    },
    {
      title: 'Chunks Indexed',
      value: isLoading ? '...' : formatNumber(summary?.total_chunks),
      change: isLoading ? 'loading' : `${formatNumber(summary?.total_embeddings)} embeddings`,
      trend: 'neutral',
      icon: vectorEmbedImg,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20'
    },
    {
      title: 'AI Chat Queries',
      value: isLoading ? '...' : formatNumber(summary?.total_ai_queries),
      change: 'live',
      trend: 'neutral',
      icon: chatQueryImg,
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20'
    },
    {
      title: 'Avg Retrieval Time',
      value: isLoading ? '...' : summary?.average_retrieval_label || '0ms',
      change: 'avg',
      trend: 'neutral',
      icon: '/Retrival Time.png',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real upload, indexing, search, and RAG activity from your document system.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Top Section: 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <StatsCard 
            key={idx}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            colorClass={stat.colorClass}
          />
        ))}
      </div>

      {/* Middle Section: Upload Panel (2/3) & Recent Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <UploadBox onUploadComplete={loadDashboard} />
        </div>
        <div className="lg:col-span-1 min-h-[300px]">
          <ActivityList activities={activities} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Section: Trend Chart (2/3) & Category Chart (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pb-6">
        <div className="lg:col-span-2">
          <TrendChart data={trends} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart data={categories} isLoading={isLoading} />
        </div>
      </div>

    </div>
  );
};
