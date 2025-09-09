import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const [isEnglish, setIsEnglish] = useState(true);

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
    // TODO: Implement actual language switching logic
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
    >
      <Globe className="h-4 w-4 mr-2" />
      {isEnglish ? 'ES' : 'EN'}
    </Button>
  );
};