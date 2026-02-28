import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
export const LanguageToggle = () => {
  const {
    language,
    toggleLanguage
  } = useLanguage();
  return <Button
    variant="outline"
    size="sm"
    onClick={toggleLanguage}
    className="bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700/50 text-slate-300 font-medium transition-all duration-300 shadow-sm"
  >
    <Globe className="h-4 w-4 mr-2 text-blue-400" />
    {language}
  </Button>;
};