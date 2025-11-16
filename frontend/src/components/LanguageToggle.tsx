import React from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-slate-600 text-white bg-yellow-200 hover:bg-yellow-100"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language}
    </Button>
  );
};
