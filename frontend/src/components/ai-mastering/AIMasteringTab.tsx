import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Lock } from "lucide-react";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomReferenceMastering } from "./CustomReferenceMastering";
import { GenrePresetsMastering } from "./GenrePresetsMastering";
import { useNavigate } from "react-router-dom";

export const AIMasteringTab = () => {
  const { t } = useLanguage();
  const { isPremium, loading, subscription, isAdmin } = useUserSubscription();
  const [activeSubTab, setActiveSubTab] = useState("custom");
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="bg-slate-900/90 border-slate-600">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-300">{t("status.loading")}...</p>
        </CardContent>
      </Card>
    );
  }

  // Premium access required
  if (!isPremium) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-400/40 shadow-xl">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Lock className="h-24 w-24 text-purple-400 animate-pulse" />
              <Crown className="h-12 w-12 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
              {t("aiMastering.premiumFeature")}
            </h2>
            <p className="text-slate-300 text-lg">
              {t("aiMastering.unlockMessage")}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 space-y-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-200">
                {t("aiMastering.feature1")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <span className="text-slate-200">
                {t("aiMastering.feature2")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-pink-400 flex-shrink-0" />
              <span className="text-slate-200">
                {t("aiMastering.feature3")}
              </span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-xl shadow-2xl shadow-purple-500/50 text-lg"
            size="lg"
          >
            <Crown className="h-6 w-6 mr-2" />
            {t("aiMastering.upgradeToPremium")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Premium content
  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-cyan-400 text-sm text-center">
          {t("aiMastering.infoBanner")}
        </p>
      </div>

      {/* Sub-tabs for AI Mastering */}
      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-card border-2 border-border p-1 rounded-xl">
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all duration-300 font-semibold rounded-lg"
          >
            {t("aiMastering.customReference")}
          </TabsTrigger>
          <TabsTrigger
            value="preset"
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all duration-300 font-semibold rounded-lg"
          >
            {t("aiMastering.genrePresets")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="mt-6">
          <CustomReferenceMastering />
        </TabsContent>

        <TabsContent value="preset" className="mt-6">
          <GenrePresetsMastering />
        </TabsContent>
      </Tabs>
    </div>
  );
};
