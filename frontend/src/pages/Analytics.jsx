import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TrendChart } from '../components/dashboard/TrendChart';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  getAnalyticsOverview,
  getAnalyticsQueryTrends,
  getTopDocuments
} from '../services/analyticsService';
import { Button } from '../components/ui/Button';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);
const DATE_RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

export const Analytics = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [topDocuments, setTopDocuments] = useState([]);
  const [queryTrends, setQueryTrends] = useState([]);
  const [dateRange, setDateRange] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        const [overviewData, topDocumentsData, queryTrendData] = await Promise.all([
          getAnalyticsOverview(dateRange),
          getTopDocuments(dateRange),
          getAnalyticsQueryTrends(Math.min(dateRange, 30)),
        ]);

        setOverview(overviewData);
        setTopDocuments(topDocumentsData);
        setQueryTrends(queryTrendData);
        setError(null);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load analytics data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [dateRange]);

  const handleExportCsv = () => {
    const headers = ['Document Name', 'Total Queries', 'Avg. Relevance', 'Response Time', 'Trend'];
    const rows = topDocuments.map((doc) => [
      doc.name,
      doc.queries,
      doc.score,
      doc.avgTime,
      doc.trend,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top-documents-${dateRange}-days.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleOpenDocumentDrilldown = (doc) => {
    if (!doc.id || doc.id === 'Unknown' || doc.id === doc.name) return;
    navigate('/search', {
      state: {
        selectedDocumentIds: [doc.id],
        query: doc.name.replace(/\.[^.]+$/, ''),
        autoSearch: true,
      },
    });
  };

  const stats = [
    {
      title: 'Total Queries',
      value: isLoading ? '...' : formatNumber(overview?.total_queries),
      change: 'live',
      trend: 'neutral',
      icon: '/total query.png',
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20'
    },
    {
      title: 'Processed Docs',
      value: isLoading ? '...' : formatNumber(overview?.processed_docs),
      change: 'indexed',
      trend: 'neutral',
      icon: '/Active users.png',
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20'
    },
    {
      title: 'Avg. Retrieval Score',
      value: isLoading ? '...' : overview?.avg_retrieval_score_label || '0%',
      change: 'avg',
      trend: 'neutral',
      icon: '/Response time.png',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
    },
    {
      title: 'Avg. Response Time',
      value: isLoading ? '...' : overview?.avg_response_time_label || '0ms',
      change: 'avg',
      trend: 'neutral',
      icon: '/Usage growth.png',
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor real query performance, document coverage, and retrieval quality.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Range</span>
          <select
            value={dateRange}
            onChange={(event) => setDateRange(Number(event.target.value))}
            className="bg-transparent text-sm font-medium text-slate-800 outline-none dark:text-slate-100"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <StatsCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={queryTrends} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart data={overview?.category_breakdown || []} isLoading={isLoading} />
        </div>
      </div>

      {/* Top Performing Documents Table */}
      <Card className="overflow-hidden p-0 border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/50 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Top Performing Documents</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Documents most frequently referenced in semantic search and AI chat.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={Download}
            onClick={handleExportCsv}
            disabled={isLoading || topDocuments.length === 0}
          >
            Export CSV
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4">Document Name</th>
                <th className="px-6 py-4">Total Queries</th>
                <th className="px-6 py-4">Avg. Relevance</th>
                <th className="px-6 py-4">Response Time</th>
                <th className="px-6 py-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900/30">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading document analytics...
                  </td>
                </tr>
              )}

              {!isLoading && topDocuments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No document query activity yet. Run semantic search or AI chat to populate this table.
                  </td>
                </tr>
              )}

              {!isLoading && topDocuments.map((doc) => {
                const isPositive = doc.trend.startsWith('+') || doc.trend === '0%';
                const canDrillDown = doc.id && doc.id !== 'Unknown' && doc.id !== doc.name;
                return (
                  <tr
                    key={doc.id}
                    onClick={() => handleOpenDocumentDrilldown(doc)}
                    className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${canDrillDown ? 'cursor-pointer' : 'cursor-default'}`}
                    title={canDrillDown ? 'Open document drill-down' : 'Document drill-down is available for new analytics events'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{formatNumber(doc.queries)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="purple" className="px-2 py-0.5 border-0 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        {doc.score}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{doc.avgTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {doc.trend}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
};
