'use client';

/**
 * Hook to check if AI features are enabled
 * Story: E1-S6 - Hide AI features until configured
 *
 * AI features are enabled when the user has configured at least one API key
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAIEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAPIKeys = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        // Check if user has any API keys configured
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking API keys:', error);
          setEnabled(false);
        } else {
          setEnabled(data && data.length > 0);
        }
      } catch (err) {
        console.error('Error in useAIEnabled:', err);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkAPIKeys();
  }, [supabase]);

  return { enabled, loading };
}

export default useAIEnabled;
