import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RefreshCw } from 'lucide-react';
import { FileIcon } from '../documents/FileIcon';

const ActivityImageIcon = ({ src, alt }) => (
  <img src={src} alt={alt} className="h-5 w-5 object-contain" />
);

const getIcon = (type, title) => {
  switch (type) {
    case 'upload':
      return <ActivityImageIcon src="/upload file.png" alt="Upload activity" />;
    case 'rag_query':
      return <ActivityImageIcon src="/message.png" alt="Chat activity" />;
    case 'process':
      return <RefreshCw size={16} className="text-amber-600 dark:text-amber-400" />;
    case 'semantic_search':
      return <ActivityImageIcon src="/search.png" alt="Search activity" />;
    default:
      return <FileIcon fileName={title} className="w-4 h-4" />;
  }
};

const getIconBg = (type) => {
  switch (type) {
    case 'upload':
      return 'bg-blue-100 dark:bg-blue-500/10';
    case 'rag_query':
      return 'bg-indigo-100 dark:bg-indigo-500/10';
    case 'process':
      return 'bg-amber-100 dark:bg-amber-500/10';
    case 'semantic_search':
      return 'bg-purple-100 dark:bg-purple-500/10';
    default:
      return 'bg-slate-100 dark:bg-slate-800';
  }
};

const getBadgeColor = (status) => {
  switch (status) {
    case 'completed':
    case 'success':
      return 'success';
    case 'processing':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

export const ActivityList = ({ activities = [], isLoading = false }) => {
  return (
    <Card padding="md" className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
        {isLoading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading activity...</p>
        )}

        {!isLoading && activities.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No activity yet. Upload documents or run a query to populate this feed.
          </p>
        )}

        {!isLoading && activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(activity.type)}`}>
              {getIcon(activity.type, activity.title)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {activity.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.time}
                </span>
                <span className="text-slate-300 dark:text-slate-600 text-xs">&middot;</span>
                <Badge variant={getBadgeColor(activity.status)} className="scale-90 origin-left border-0">
                  {activity.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
