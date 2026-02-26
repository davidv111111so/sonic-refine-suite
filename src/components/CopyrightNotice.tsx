import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
export const CopyrightNotice = () => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-full px-4 py-1.5 w-fit mx-auto shadow-sm">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-3 w-3 text-cyan-400 flex-shrink-0" />
        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-medium">
          © 2024 Sonic Refine Suite • <span className="text-slate-300">Users retain all rights</span> • Proper licensing required for processed content
        </p>
      </div>
    </div>
  );
};