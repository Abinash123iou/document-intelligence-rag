import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

export const CategoryChart = ({ data = [], isLoading = false }) => {
  const { theme } = useTheme();
  const hasData = data.length > 0;

  return (
    <Card padding="md" className="h-full flex flex-col min-h-[350px]">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Documents by Category</h3>

      <div className="flex-1 min-h-[250px] w-full relative">
        {isLoading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading categories...</p>
        )}

        {!isLoading && !hasData && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No uploaded documents yet.</p>
        )}

        {!isLoading && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
                strokeWidth={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                  borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
