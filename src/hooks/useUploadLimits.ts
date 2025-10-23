import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadLimits {
  dailyLimit: number;
  maxFileSize: number; // in MB
  uploadsToday: number;
  canUpload: boolean;
  remainingUploads: number;
}

export const useUploadLimits = () => {
  const [uploadsToday, setUploadsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // No limits for any user - all features unrestricted
  const dailyLimit = Infinity;
  const maxFileSize = Infinity;

  useEffect(() => {
    fetchUploadCount();
  }, []);

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