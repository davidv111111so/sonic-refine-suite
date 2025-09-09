import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const CopyrightNotice = () => {
  return (
    <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/40">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-300 mb-2">Copyright Notice</h4>
            <p className="text-orange-200 text-sm leading-relaxed">
              We do not own or retain any rights to the processed tracks or songs, including master rights and copyrights. 
              In the case of AI mastering, the rights will be retained by the user. We are not responsible for any 
              infringement of master rights; each user must own the respective rights before using our services.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};