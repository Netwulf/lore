'use client';

import { useState, useCallback } from 'react';
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

/**
 * useGraph hook for fetching graph visualization data
 * E6-S2: Fixed race condition by fetching userId inline instead of depending on state
 */
export function useGraph() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  /**
   * Fetch all pages and links for the graph visualization
   * E6-S2: Now fetches user inline to avoid race condition with auth state
   */
  const fetchGraphData = useCallback(async (): Promise<GraphData> => {
    setLoading(true);
    try {
      // E6-S2: Fetch userId inline instead of depending on state
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user for graph');
        return { nodes: [], edges: [] };
      }

      const [pagesRes, linksRes] = await Promise.all([
        supabase
          .from('pages')
          .select('id, title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('page_links')
          .select('source_id, target_id')
          .eq('user_id', user.id),
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
  }, [supabase]);

  return {
    fetchGraphData,
    loading,
  };
}

export default useGraph;
