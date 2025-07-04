
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('perfect-audio-theme');
    
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      // High contrast light mode
      document.body.className = 'bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900';
      document.body.style.setProperty('--background', '0 0% 100%');
      document.body.style.setProperty('--foreground', '0 0% 3.9%');
      document.body.style.setProperty('--card', '0 0% 100%');
      document.body.style.setProperty('--card-foreground', '0 0% 3.9%');
      document.body.style.setProperty('--popover', '0 0% 100%');
      document.body.style.setProperty('--popover-foreground', '0 0% 3.9%');
      document.body.style.setProperty('--primary', '0 0% 9%');
      document.body.style.setProperty('--primary-foreground', '0 0% 98%');
      document.body.style.setProperty('--secondary', '0 0% 96.1%');
      document.body.style.setProperty('--secondary-foreground', '0 0% 9%');
      document.body.style.setProperty('--muted', '0 0% 96.1%');
      document.body.style.setProperty('--muted-foreground', '0 0% 45.1%');
      document.body.style.setProperty('--accent', '0 0% 96.1%');
      document.body.style.setProperty('--accent-foreground', '0 0% 9%');
      document.body.style.setProperty('--destructive', '0 84.2% 60.2%');
      document.body.style.setProperty('--destructive-foreground', '0 0% 98%');
      document.body.style.setProperty('--border', '0 0% 89.8%');
      document.body.style.setProperty('--input', '0 0% 89.8%');
      document.body.style.setProperty('--ring', '0 0% 3.9%');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      // High contrast dark mode
      document.body.className = 'bg-gradient-to-br from-black via-slate-900 to-black text-white';
      document.body.style.setProperty('--background', '0 0% 3.9%');
      document.body.style.setProperty('--foreground', '0 0% 98%');
      document.body.style.setProperty('--card', '0 0% 3.9%');
      document.body.style.setProperty('--card-foreground', '0 0% 98%');
      document.body.style.setProperty('--popover', '0 0% 3.9%');
      document.body.style.setProperty('--popover-foreground', '0 0% 98%');
      document.body.style.setProperty('--primary', '0 0% 98%');
      document.body.style.setProperty('--primary-foreground', '0 0% 9%');
      document.body.style.setProperty('--secondary', '0 0% 14.9%');
      document.body.style.setProperty('--secondary-foreground', '0 0% 98%');
      document.body.style.setProperty('--muted', '0 0% 14.9%');
      document.body.style.setProperty('--muted-foreground', '0 0% 63.9%');
      document.body.style.setProperty('--accent', '0 0% 14.9%');
      document.body.style.setProperty('--accent-foreground', '0 0% 98%');
      document.body.style.setProperty('--destructive', '0 62.8% 30.6%');
      document.body.style.setProperty('--destructive-foreground', '0 0% 98%');
      document.body.style.setProperty('--border', '0 0% 14.9%');
      document.body.style.setProperty('--input', '0 0% 14.9%');
      document.body.style.setProperty('--ring', '0 0% 83.1%');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      // Switch to light mode with high contrast
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900';
      document.body.style.setProperty('--background', '0 0% 100%');
      document.body.style.setProperty('--foreground', '0 0% 3.9%');
      document.body.style.setProperty('--card', '0 0% 100%');
      document.body.style.setProperty('--card-foreground', '0 0% 3.9%');
      document.body.style.setProperty('--popover', '0 0% 100%');
      document.body.style.setProperty('--popover-foreground', '0 0% 3.9%');
      document.body.style.setProperty('--primary', '0 0% 9%');
      document.body.style.setProperty('--primary-foreground', '0 0% 98%');
      document.body.style.setProperty('--secondary', '0 0% 96.1%');
      document.body.style.setProperty('--secondary-foreground', '0 0% 9%');
      document.body.style.setProperty('--muted', '0 0% 96.1%');
      document.body.style.setProperty('--muted-foreground', '0 0% 45.1%');
      document.body.style.setProperty('--accent', '0 0% 96.1%');
      document.body.style.setProperty('--accent-foreground', '0 0% 9%');
      document.body.style.setProperty('--destructive', '0 84.2% 60.2%');
      document.body.style.setProperty('--destructive-foreground', '0 0% 98%');
      document.body.style.setProperty('--border', '0 0% 89.8%');
      document.body.style.setProperty('--input', '0 0% 89.8%');
      document.body.style.setProperty('--ring', '0 0% 3.9%');
      localStorage.setItem('perfect-audio-theme', 'light');
      setIsDarkMode(false);
    } else {
      // Switch to dark mode with high contrast
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-gradient-to-br from-black via-slate-900 to-black text-white';
      document.body.style.setProperty('--background', '0 0% 3.9%');
      document.body.style.setProperty('--foreground', '0 0% 98%');
      document.body.style.setProperty('--card', '0 0% 3.9%');
      document.body.style.setProperty('--card-foreground', '0 0% 98%');
      document.body.style.setProperty('--popover', '0 0% 3.9%');
      document.body.style.setProperty('--popover-foreground', '0 0% 98%');
      document.body.style.setProperty('--primary', '0 0% 98%');
      document.body.style.setProperty('--primary-foreground', '0 0% 9%');
      document.body.style.setProperty('--secondary', '0 0% 14.9%');
      document.body.style.setProperty('--secondary-foreground', '0 0% 98%');
      document.body.style.setProperty('--muted', '0 0% 14.9%');
      document.body.style.setProperty('--muted-foreground', '0 0% 63.9%');
      document.body.style.setProperty('--accent', '0 0% 14.9%');
      document.body.style.setProperty('--accent-foreground', '0 0% 98%');
      document.body.style.setProperty('--destructive', '0 62.8% 30.6%');
      document.body.style.setProperty('--destructive-foreground', '0 0% 98%');
      document.body.style.setProperty('--border', '0 0% 14.9%');
      document.body.style.setProperty('--input', '0 0% 14.9%');
      document.body.style.setProperty('--ring', '0 0% 83.1%');
      localStorage.setItem('perfect-audio-theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full hover:bg-slate-700/50 transition-all duration-300 border border-slate-600"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 drop-shadow-lg" />
      )}
    </Button>
  );
};
