import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

// Helper function to apply theme styles
const applyTheme = (isDark: boolean) => {
  if (isDark) {
    // Switch to PURE BLACK dark mode with bright text
    document.documentElement.classList.add('dark');
    document.body.className = 'text-white';
    document.body.style.background = '#000000';
    document.body.style.setProperty('--background', '0 0% 0%'); // Pure black
    document.body.style.setProperty('--foreground', '0 0% 100%'); // Pure white text
    document.body.style.setProperty('--card', '0 0% 5%'); // Very dark cards
    document.body.style.setProperty('--card-foreground', '0 0% 100%');
    document.body.style.setProperty('--popover', '0 0% 5%');
    document.body.style.setProperty('--popover-foreground', '0 0% 100%');
    document.body.style.setProperty('--primary', '221 83% 53%'); // Bright blue
    document.body.style.setProperty('--primary-foreground', '0 0% 100%');
    document.body.style.setProperty('--secondary', '0 0% 15%');
    document.body.style.setProperty('--secondary-foreground', '0 0% 100%');
    document.body.style.setProperty('--muted', '0 0% 15%');
    document.body.style.setProperty('--muted-foreground', '0 0% 70%');
    document.body.style.setProperty('--accent', '271 91% 65%'); // Bright purple
    document.body.style.setProperty('--accent-foreground', '0 0% 100%');
    document.body.style.setProperty('--destructive', '0 84% 60%');
    document.body.style.setProperty('--destructive-foreground', '0 0% 100%');
    document.body.style.setProperty('--border', '0 0% 20%');
    document.body.style.setProperty('--input', '0 0% 20%');
    document.body.style.setProperty('--ring', '221 83% 53%');
  } else {
    // Switch to light mode with high contrast and legible text
    document.documentElement.classList.remove('dark');
    document.body.className = 'bg-gradient-to-br from-white via-gray-50 to-slate-100 text-slate-950 font-medium';
    document.body.style.setProperty('--background', '0 0% 100%');
    document.body.style.setProperty('--foreground', '222 47% 11%');
    document.body.style.setProperty('--card', '0 0% 100%');
    document.body.style.setProperty('--card-foreground', '222 47% 11%');
    document.body.style.setProperty('--popover', '0 0% 100%');
    document.body.style.setProperty('--popover-foreground', '222 47% 11%');
    document.body.style.setProperty('--primary', '221 83% 53%');
    document.body.style.setProperty('--primary-foreground', '210 40% 98%');
    document.body.style.setProperty('--secondary', '210 40% 96%');
    document.body.style.setProperty('--secondary-foreground', '222 47% 11%');
    document.body.style.setProperty('--muted', '210 40% 96%');
    document.body.style.setProperty('--muted-foreground', '215 25% 27%'); // Much darker muted text
    document.body.style.setProperty('--accent', '210 40% 96%');
    document.body.style.setProperty('--accent-foreground', '222 47% 11%');
    document.body.style.setProperty('--destructive', '0 84% 60%');
    document.body.style.setProperty('--destructive-foreground', '210 40% 98%');
    document.body.style.setProperty('--border', '214 32% 85%'); // Darker borders
    document.body.style.setProperty('--input', '214 32% 85%');
    document.body.style.setProperty('--ring', '221 83% 53%');
  }
};

export const ThemeToggle = () => {
  // Detect system theme preference like Cursor does
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('perfect-audio-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme === 'dark';
    }
    // If no saved preference, default to dark mode
    return true;
  });

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('perfect-audio-theme');
    let initialIsDark: boolean;
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      initialIsDark = savedTheme === 'dark';
    } else {
      // Default to dark mode for all new users
      initialIsDark = true;
      localStorage.setItem('perfect-audio-theme', 'dark');
    }
    
    setIsDarkMode(initialIsDark);
    applyTheme(initialIsDark);

    // Listen for system theme changes (like Cursor does)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('perfect-audio-theme');
      // Only auto-update if user hasn't manually set a preference
      if (!savedTheme) {
        const newIsDark = e.matches;
        setIsDarkMode(newIsDark);
        applyTheme(newIsDark);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem('perfect-audio-theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} 
      className="rounded-full transition-all duration-300 border border-slate-600 bg-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300 drop-shadow-lg" />
      )}
    </Button>
  );
};
