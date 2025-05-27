
import { useState, useCallback } from 'react';

export interface EnhancementHistoryEntry {
  id: string;
  fileName: string;
  timestamp: Date;
  settings: any;
  originalSize: number;
  enhancedSize: number;
  status: 'success' | 'error';
}

export const useEnhancementHistory = () => {
  const [history, setHistory] = useState<EnhancementHistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<EnhancementHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: EnhancementHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
    console.log('Added to enhancement history:', newEntry);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    console.log('Enhancement history cleared');
  }, []);

  return { history, addToHistory, clearHistory };
};
