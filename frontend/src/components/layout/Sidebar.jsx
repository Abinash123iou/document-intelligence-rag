import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Files, 
  MessageSquare, 
  Search, 
  BarChart2, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed, profile }) => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Upload Documents', icon: UploadCloud, path: '/upload' },
    { label: 'Documents', icon: Files, path: '/documents' },
    { label: 'AI Chat', icon: MessageSquare, path: '/chat' },
    { label: 'Semantic Search', icon: Search, path: '/search' },
    { label: 'Analytics', icon: BarChart2, path: '/analytics' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:relative"
      )}
    >
      {/* Header / Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-border relative transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
            <img src="/Logo.png" alt="DocIntel Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg whitespace-nowrap text-slate-900 dark:text-white">
              DocIntel
            </span>
          )}
        </div>
        {/* Collapse toggle (Desktop only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden md:flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shadow-sm",
            "absolute -right-3 top-5 z-40"
          )}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item, index) => (
          <NavLink
            key={`${item.label}-${index}`}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              isActive 
                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <item.icon size={20} className={cn("flex-shrink-0 transition-colors", isCollapsed ? "mx-auto" : "")} />
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Profile Card */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-slate-800/60 flex items-center justify-center flex-shrink-0 border border-indigo-200/50 dark:border-slate-700/50 overflow-hidden">
            <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {profile.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
