import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { loadProfileSettings, PROFILE_STORAGE_KEY, PROFILE_UPDATED_EVENT } from '../../utils/profileSettings';

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => loadProfileSettings());

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      setProfile(event.detail || loadProfileSettings());
    };

    const handleStorage = (event) => {
      if (event.key === PROFILE_STORAGE_KEY) {
        setProfile(loadProfileSettings());
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        profile={profile}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          profile={profile}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
