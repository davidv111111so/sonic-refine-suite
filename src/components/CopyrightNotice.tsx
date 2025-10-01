import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const CopyrightNotice = () => {
  return (
    <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-600/30">
      <CardContent className="p-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-orange-200 text-xs leading-relaxed">
            <span className="font-semibold">Copyright Notice:</span> We do not own or retain any rights to processed tracks. 
            Users retain all rights and must own proper licenses before using our services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};