import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
          theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
        aria-label="Toggle theme"
      >
        <span
          className={`${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-sm`}
        >
          {theme === 'dark' ? (
            <Moon className="h-2.5 w-2.5 text-indigo-600" strokeWidth={3} />
          ) : (
            <Sun className="h-2.5 w-2.5 text-amber-500" strokeWidth={3} />
          )}
        </span>
      </button>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </div>
  );
};

export default ThemeToggle;
