import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSubscription } from './useUserSubscription';
import { toast } from 'sonner';

interface UploadLimits {
  dailyLimit: number;
  maxFileSize: number; // in MB
  uploadsToday: number;
  canUpload: boolean;
  remainingUploads: number;
}

export const useUploadLimits = () => {
  const { isPremium, isAdmin, loading: subscriptionLoading } = useUserSubscription();
  const [uploadsToday, setUploadsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // Admins have no limits
  if (isAdmin) {
    return {
      dailyLimit: Infinity,
      maxFileSize: Infinity,
      uploadsToday: 0,
      canUpload: true,
      remainingUploads: Infinity,
      loading: false,
      incrementUploadCount: async () => {},
      resetDailyCount: async () => {},
    };
  }

  const dailyLimit = isPremium ? 50 : 5;
  const maxFileSize = isPremium ? 150 : 50;

  useEffect(() => {
    if (!subscriptionLoading) {
      fetchUploadCount();
    }
  }, [subscriptionLoading, isPremium]);

  const fetchUploadCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_uploads')
        .select('upload_count')
        .eq('user_id', session.user.id)
        .eq('upload_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching upload count:', error);
      }

      setUploadsToday(data?.upload_count || 0);
    } catch (error) {
      console.error('Error in fetchUploadCount:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUploadCount = async (count: number = 1) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];

      // Check current count
      const { data: existing } = await supabase
        .from('daily_uploads')
        .select('upload_count')
        .eq('user_id', session.user.id)
        .eq('upload_date', today)
        .maybeSingle();

      const newCount = (existing?.upload_count || 0) + count;

      // Upsert the count
      const { error } = await supabase
        .from('daily_uploads')
        .upsert({
          user_id: session.user.id,
          upload_date: today,
          upload_count: newCount,
        }, {
          onConflict: 'user_id,upload_date',
        });

      if (error) {
        console.error('Error incrementing upload count:', error);
      } else {
        setUploadsToday(newCount);
      }
    } catch (error) {
      console.error('Error in incrementUploadCount:', error);
    }
  };

  const resetDailyCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('daily_uploads')
        .delete()
        .eq('user_id', session.user.id)
        .neq('upload_date', today);

      if (error) {
        console.error('Error resetting daily count:', error);
      }
    } catch (error) {
      console.error('Error in resetDailyCount:', error);
    }
  };

  const remainingUploads = Math.max(0, dailyLimit - uploadsToday);
  const canUpload = uploadsToday < dailyLimit;

  return {
    dailyLimit,
    maxFileSize,
    uploadsToday,
    canUpload,
    remainingUploads,
    loading,
    incrementUploadCount,
    resetDailyCount,
  };
};