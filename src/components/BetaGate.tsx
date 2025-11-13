import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { supabase } from '@/integrations/supabase/client';
import { BETA_CONFIG } from '@/config/beta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';

interface BetaGateProps {
  children: React.ReactNode;
}

export const BetaGate: React.FC<BetaGateProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: subscriptionLoading } = useUserSubscription();
  const [isBetaUser, setIsBetaUser] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBetaAccess = async () => {
      // If beta mode is disabled, allow all access
      if (!BETA_CONFIG.BETA_MODE_ENABLED) {
        setIsBetaUser(true);
        setChecking(false);
        return;
      }

      // Wait for auth to load
      if (authLoading || subscriptionLoading) {
        return;
      }

      // If no user, deny access
      if (!user) {
        setIsBetaUser(false);
        setChecking(false);
        return;
      }

      // Check if user is admin (bypass beta)
      const userEmail = user.email?.toLowerCase();
      const isAdminEmail = userEmail && BETA_CONFIG.ADMIN_EMAILS.includes(userEmail);
      
      if (isAdminEmail || isAdmin) {
        setIsBetaUser(true);
        setChecking(false);
        return;
      }

      // Check if user is in beta whitelist via database
      try {
        const { data: betaData, error } = await supabase.rpc('is_beta_user', {
          _user_id: user.id
        });

        if (error) {
          console.error('Beta check error:', error);
          setIsBetaUser(false);
        } else {
          setIsBetaUser(betaData === true);
        }
      } catch (error) {
        console.error('Beta check failed:', error);
        setIsBetaUser(false);
      } finally {
        setChecking(false);
      }
    };

    checkBetaAccess();
  }, [user, authLoading, subscriptionLoading, isAdmin]);

  // Show loading state
  if (checking || authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If beta mode is disabled, show children
  if (!BETA_CONFIG.BETA_MODE_ENABLED) {
    return <>{children}</>;
  }

  // If user has beta access, show children
  if (isBetaUser === true) {
    return <>{children}</>;
  }

  // Show beta restriction message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="max-w-md w-full border-red-500/50 bg-slate-800/90">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-500/20 p-4">
              <Lock className="h-12 w-12 text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            {BETA_CONFIG.BETA_MESSAGE.title}
          </CardTitle>
          <CardDescription className="text-slate-300 mt-4">
            {BETA_CONFIG.BETA_MESSAGE.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <p className="text-sm text-slate-300 text-center">
              {BETA_CONFIG.BETA_MESSAGE.contact}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth';
              }}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700">
            Error Code: BETA_ACCESS_DENIED
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


