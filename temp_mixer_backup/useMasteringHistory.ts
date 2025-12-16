import { useState, useEffect, useCallback } from 'react';

export interface MasteringHistoryEntry {
  id: string;
  timestamp: Date;
  targetFileName: string;
  referenceFileName: string;
  status: 'success' | 'error' | 'cancelled';
  errorMessage?: string;
  masteredUrl?: string;
  processingTime?: number;
  settings?: any;
}

const STORAGE_KEY = 'mastering_history';
const MAX_HISTORY_ENTRIES = 50;

export const useMasteringHistory = () => {
  const [history, setHistory] = useState<MasteringHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setHistory(withDates);
      }
    } catch (error) {
      console.error('Failed to load mastering history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save mastering history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((entry: Omit<MasteringHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: MasteringHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES));
    console.log('Added to mastering history:', newEntry);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('Mastering history cleared');
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, []);

  return { 
    history, 
    addToHistory, 
    clearHistory,
    removeEntry 
  };
};
