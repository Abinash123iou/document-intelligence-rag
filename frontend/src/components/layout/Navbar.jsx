import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Sun, Moon, Upload, Check, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { deleteRecentActivity, getRecentActivity } from '../../services/dashboardService';

const NOTIFICATION_READ_KEY = 'docintel_notifications_read_at';

const ActivityImageIcon = ({ src, alt }) => (
  <img src={src} alt={alt} className="h-4 w-4 object-contain" />
);

const getActivityIcon = (type) => {
  switch (type) {
    case 'upload':
      return <ActivityImageIcon src="/upload file.png" alt="Upload activity" />;
    case 'rag_query':
      return <ActivityImageIcon src="/message.png" alt="Chat activity" />;
    case 'semantic_search':
      return <ActivityImageIcon src="/search.png" alt="Search activity" />;
    default:
      return <Bell size={14} className="text-slate-500" />;
  }
};

export const Navbar = ({ onMenuClick, profile }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [readAt, setReadAt] = useState(() => localStorage.getItem(NOTIFICATION_READ_KEY) || '');

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getRecentActivity();
        setActivities(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadActivities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => {
    const readTime = readAt ? new Date(readAt).getTime() : 0;
    return activities.filter((activity) => {
      const activityTime = activity.created_at ? new Date(activity.created_at).getTime() : 0;
      return activityTime > readTime;
    }).length;
  }, [activities, readAt]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(NOTIFICATION_READ_KEY, now);
    setReadAt(now);
  };

  const handleDeleteActivity = async (activityId) => {
    setActivities((current) => current.filter((activity) => activity.id !== activityId));
    try {
      await deleteRecentActivity(activityId);
    } catch (err) {
      console.error('Failed to delete activity:', err);
      try {
        const data = await getRecentActivity();
        setActivities(data);
      } catch (refreshErr) {
        console.error('Failed to refresh notifications:', refreshErr);
      }
    }
  };

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 md:px-6 glass-navbar transition-colors duration-200">
      
      {/* Left section: Mobile menu & Global search */}
      <div className="flex items-center flex-1 gap-4">
        <Button 
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Menu size={20} />
        </Button>
        
        <div className="w-full max-w-md hidden sm:block">
          <Input 
            placeholder="Search documents, entities, or concepts..." 
            leftIcon={Search}
            onFocus={() => navigate('/search')}
            readOnly
            className="h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80"
          />
        </div>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-3 ml-4">
        
        {/* Upload Button */}
        <Button 
          variant="primary" 
          size="sm"
          leftIcon={Upload}
          onClick={() => navigate('/upload')}
          className="hidden sm:flex"
        >
          Upload
        </Button>
        
        {/* Theme Toggle */}
        <Button 
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotificationsOpen((open) => !open)}
            className="relative p-2 text-slate-500 dark:text-slate-400"
            title="Recent activity"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
            )}
          </Button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  <Check size={12} />
                  Mark read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {activities.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No activity yet.
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="group flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-850 dark:text-slate-100">
                          {activity.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {activity.time} - {activity.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                        title="Delete activity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar (Mobile fallback or small visual) */}
        <div className="sm:hidden h-8 w-8 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 ml-1 overflow-hidden">
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        
      </div>
    </header>
  );
};
