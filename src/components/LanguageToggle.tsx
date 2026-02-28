import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGE_LABELS, type Language } from '@/contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGE_LABELS[language];
  const languages = Object.entries(LANGUAGE_LABELS) as [Language, { flag: string; name: string }][];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-md border border-slate-700/50 text-slate-300 font-medium transition-colors duration-300 shadow-sm gap-2"
      >
        <Globe className="h-4 w-4 text-blue-400/70" />
        <span>{current.flag} {language}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map(([code, { flag, name }]) => (
            <button
              key={code}
              onClick={() => { setLanguage(code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer
                ${language === code
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
            >
              <span className="text-lg">{flag}</span>
              <span>{name}</span>
              {language === code && <span className="ml-auto text-cyan-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};