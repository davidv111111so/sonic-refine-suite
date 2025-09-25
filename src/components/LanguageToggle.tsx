import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language}
    </Button>
  );
};