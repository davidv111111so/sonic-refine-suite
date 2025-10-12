import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
export const CopyrightNotice = () => {
  return <div className="bg-gradient-to-r from-orange-900/15 to-red-900/15 border border-orange-600/20 rounded-md p-1.5 bg-blue-900">
      <div className="flex items-center gap-1.5">
        <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0" />
        <p className="text-orange-200 text-[10px] leading-tight">
          <span className="font-semibold">Copyright:</span> Users retain all rights. Proper licenses required.
        </p>
      </div>
    </div>;
};