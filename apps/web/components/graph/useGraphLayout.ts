import { useState, useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/hooks/useGraph';

interface LayoutNode {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface LayoutResult {
  nodes: LayoutNode[];
}

interface UseGraphLayoutOptions {
  width?: number;
  height?: number;
}

interface UseGraphLayoutReturn {
  layout: LayoutResult | null;
  progress: number;
  isCalculating: boolean;
  error: Error | null;
}

/**
 * Hook to calculate force-directed graph layout using Web Worker
 * Falls back to sync calculation if Worker is unavailable
 */
export function useGraphLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: UseGraphLayoutOptions = {}
): UseGraphLayoutReturn {
  const { width = 800, height = 600 } = options;

  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Stable reference for input data
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Calculate layout when inputs change
  useEffect(() => {
    // Skip if no nodes
    if (nodes.length === 0) {
      setLayout({ nodes: [] });
      setIsCalculating(false);
      return;
    }

    // Reset state
    setIsCalculating(true);
    setProgress(0);
    setError(null);
    setLayout(null);

    // Terminate existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    try {
      // Create new worker
      workerRef.current = new Worker(
        new URL('./graphWorker.ts', import.meta.url)
      );

      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setProgress(e.data.value);
        } else if (e.data.type === 'complete') {
          setLayout({ nodes: e.data.nodes });
          setIsCalculating(false);
          setProgress(1);
        }
      };

      workerRef.current.onerror = (err) => {
        console.error('Graph worker error:', err);
        setError(new Error('Failed to calculate graph layout'));
        setIsCalculating(false);

        // Fallback to sync calculation
        fallbackSyncCalculation(nodes, edges, width, height, setLayout);
      };

      // Send data to worker
      workerRef.current.postMessage({
        nodes: nodes.map((n) => ({ id: n.id, title: n.title })),
        links: edges.map((e) => ({ source_id: e.source_id, target_id: e.target_id })),
        width,
        height,
      });
    } catch {
      // Worker not supported, use sync fallback
      console.warn('Web Worker not available, using sync fallback');
      fallbackSyncCalculation(nodes, edges, width, height, setLayout);
      setIsCalculating(false);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [nodes, edges, width, height]);

  return { layout, progress, isCalculating, error };
}

/**
 * Fallback sync calculation when Worker is unavailable
 */
function fallbackSyncCalculation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  setLayout: (result: LayoutResult) => void
) {
  // Dynamic import to avoid bundling d3-force in main chunk when Worker works
  import('d3-force').then(
    ({ forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide }) => {
      const simNodes = nodes.map((n) => ({
        id: n.id,
        title: n.title,
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 200,
      }));

      const simLinks = edges.map((e) => ({
        source: e.source_id,
        target: e.target_id,
      }));

      const simulation = forceSimulation(simNodes)
        .force(
          'link',
          forceLink(simLinks)
            .id((d) => (d as { id: string }).id)
            .distance(120)
        )
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(width / 2, height / 2))
        .force('collide', forceCollide().radius(60));

      for (let i = 0; i < 300; i++) {
        simulation.tick();
      }
      simulation.stop();

      setLayout({
        nodes: simNodes.map((n) => ({
          id: n.id,
          title: n.title,
          x: n.x ?? 0,
          y: n.y ?? 0,
        })),
      });
    }
  );
}
