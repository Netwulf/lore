'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface GraphNode {
  id: string;
  title: string;
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraph() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  /**
   * Fetch all pages and links for the graph visualization
   */
  const fetchGraphData = useCallback(async (): Promise<GraphData> => {
    if (!userId) return { nodes: [], edges: [] };

    setLoading(true);
    try {
      const [pagesRes, linksRes] = await Promise.all([
        supabase
          .from('pages')
          .select('id, title')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('page_links')
          .select('source_id, target_id')
          .eq('user_id', userId),
      ]);

      const nodes: GraphNode[] =
        pagesRes.data?.map((p) => ({
          id: p.id,
          title: p.title,
        })) || [];

      const edges: GraphEdge[] =
        linksRes.data?.map((l) => ({
          source_id: l.source_id,
          target_id: l.target_id,
        })) || [];

      return { nodes, edges };
    } catch (err) {
      console.error('Error fetching graph data:', err);
      return { nodes: [], edges: [] };
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  return {
    fetchGraphData,
    loading,
    userId,
  };
}

export default useGraph;
