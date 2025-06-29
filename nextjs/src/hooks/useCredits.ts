import { useState, useEffect, useCallback } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';

interface UseCreditsReturn {
  credits: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useGlobal();

  const fetchCredits = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const client = await createSPASassClient();
      const supabase = client.getSupabaseClient();
      
      const { data, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching credits:', fetchError);
        setError('Failed to load credits');
        return;
      }
      
      setCredits(data?.credits ?? 0);
    } catch (err) {
      console.error('Credits fetch error:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    loading,
    error,
    refetch: fetchCredits
  };
}