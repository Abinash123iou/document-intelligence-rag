import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Upload = lazy(() => import('./pages/Upload').then((module) => ({ default: module.Upload })));
const Documents = lazy(() => import('./pages/Documents').then((module) => ({ default: module.Documents })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((module) => ({ default: module.ChatPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((module) => ({ default: module.SearchPage })));
const Analytics = lazy(() => import('./pages/Analytics').then((module) => ({ default: module.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
  </div>
);

const lazyPage = (Page) => (
  <Suspense fallback={<PageLoader />}>
    <Page />
  </Suspense>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={lazyPage(Dashboard)} />
        <Route path="upload" element={lazyPage(Upload)} />
        <Route path="documents" element={lazyPage(Documents)} />
        <Route path="chat" element={lazyPage(ChatPage)} />
        <Route path="search" element={lazyPage(SearchPage)} />
        <Route path="analytics" element={lazyPage(Analytics)} />
        <Route path="settings" element={lazyPage(Settings)} />
      </Route>
    </Routes>
  );
}

export default App;
