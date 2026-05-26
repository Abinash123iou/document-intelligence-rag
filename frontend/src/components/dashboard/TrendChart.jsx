import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

export const TrendChart = ({ data = [], isLoading = false }) => {
  const { theme } = useTheme();
  const hasData = data.some((point) => point.queries > 0 || point.documents > 0);

  return (
    <Card padding="md" className="h-full flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Usage Trends</h3>
        <select className="text-sm border-0 bg-transparent text-slate-500 dark:text-slate-400 focus:ring-0 cursor-pointer outline-none">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        {isLoading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading trends...</p>
        )}

        {!isLoading && !hasData && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No upload or query activity in the last 7 days.</p>
        )}

        {!isLoading && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} 
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
                borderRadius: '12px',
                color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="queries" 
              stroke="#6366F1" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorQueries)" 
              name="Semantic Queries"
            />
            <Area 
              type="monotone" 
              dataKey="documents" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorDocs)" 
              name="Documents Uploaded"
            />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
