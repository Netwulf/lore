'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { useGraph, type GraphData, type GraphNode, type GraphEdge } from '@/lib/hooks/useGraph';

interface GraphViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageId?: string;
}

type DepthFilter = 1 | 2 | 3 | 'all';

interface SimNode extends SimulationNodeDatum {
  id: string;
  title: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

/**
 * Calculate node positions using d3-force simulation
 */
function calculateForceLayout(
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[],
  width: number = 800,
  height: number = 600
): Node[] {
  if (graphNodes.length === 0) return [];

  const simNodes: SimNode[] = graphNodes.map((n) => ({
    id: n.id,
    title: n.title,
    x: width / 2 + (Math.random() - 0.5) * 200,
    y: height / 2 + (Math.random() - 0.5) * 200,
  }));

  const simLinks: SimLink[] = graphEdges.map((e) => ({
    source: e.source_id,
    target: e.target_id,
  }));

  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(120)
    )
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide().radius(60));

  // Run simulation synchronously
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }
  simulation.stop();

  return simNodes.map((node) => ({
    id: node.id,
    type: 'default',
    data: { label: node.title },
    position: {
      x: node.x || 0,
      y: node.y || 0,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

/**
 * Filter nodes and edges by depth from a center node
 */
function filterByDepth(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerId: string,
  depth: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const visited = new Set<string>([centerId]);
  const queue = [{ id: centerId, level: 0 }];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (level >= depth) continue;

    edges.forEach((l) => {
      let neighborId: string | null = null;
      if (l.source_id === id) neighborId = l.target_id;
      else if (l.target_id === id) neighborId = l.source_id;

      if (neighborId && !visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, level: level + 1 });
      }
    });
  }

  return {
    nodes: nodes.filter((n) => visited.has(n.id)),
    edges: edges.filter(
      (l) => visited.has(l.source_id) && visited.has(l.target_id)
    ),
  };
}

/**
 * Get connected node IDs for hover highlighting
 */
function getConnectedIds(edges: Edge[], nodeId: string): Set<string> {
  const connected = new Set<string>([nodeId]);
  edges.forEach((e) => {
    if (e.source === nodeId) connected.add(e.target);
    if (e.target === nodeId) connected.add(e.source);
  });
  return connected;
}

export function GraphViewModal({
  isOpen,
  onClose,
  currentPageId,
}: GraphViewModalProps) {
  const router = useRouter();
  const { fetchGraphData, loading } = useGraph();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [depthFilter, setDepthFilter] = useState<DepthFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Fetch graph data when modal opens
  useEffect(() => {
    if (!isOpen || hasLoaded) return;

    const loadGraph = async () => {
      const data = await fetchGraphData();
      setGraphData(data);
      setHasLoaded(true);
    };

    loadGraph();
  }, [isOpen, hasLoaded, fetchGraphData]);

  // Apply filters and calculate layout
  useEffect(() => {
    if (!hasLoaded || graphData.nodes.length === 0) return;

    let filteredData = graphData;

    // Apply depth filter if we have a current page
    if (depthFilter !== 'all' && currentPageId) {
      filteredData = filterByDepth(
        graphData.nodes,
        graphData.edges,
        currentPageId,
        depthFilter
      );
    }

    // Calculate force-directed layout
    const layoutNodes = calculateForceLayout(
      filteredData.nodes,
      filteredData.edges
    );

    // Find search match
    const searchMatch = searchQuery.trim()
      ? filteredData.nodes.find((n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase())
        )?.id
      : null;

    // Get connected IDs for hover effect
    const connectedIds = hoveredNode
      ? getConnectedIds(
          filteredData.edges.map((e) => ({
            id: `${e.source_id}-${e.target_id}`,
            source: e.source_id,
            target: e.target_id,
          })),
          hoveredNode
        )
      : null;

    // Style nodes
    const styledNodes = layoutNodes.map((node) => {
      const isCurrent = node.id === currentPageId;
      const isSearchMatch = node.id === searchMatch;
      const isHovered = node.id === hoveredNode;
      const isConnected = connectedIds?.has(node.id);
      const isDimmed = connectedIds && !isConnected;

      return {
        ...node,
        style: {
          background: isCurrent
            ? '#8dc75e'
            : isSearchMatch
            ? '#8dc75e'
            : isHovered
            ? '#261833'
            : '#1A1025',
          color: isCurrent || isSearchMatch ? '#0A0A0A' : '#F5F2EB',
          border: isHovered
            ? '2px solid #8dc75e'
            : isSearchMatch
            ? '2px solid #8dc75e'
            : '1px solid rgba(245, 242, 235, 0.2)',
          borderRadius: '0',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: isCurrent || isSearchMatch ? '600' : '400',
          minWidth: '80px',
          textAlign: 'center' as const,
          opacity: isDimmed ? 0.2 : 1,
          transition: 'opacity 0.2s, border 0.2s, background 0.2s',
        },
      };
    });

    // Style edges
    const styledEdges = filteredData.edges.map((e) => {
      const isConnected =
        connectedIds &&
        (connectedIds.has(e.source_id) || connectedIds.has(e.target_id));
      const isDimmed = connectedIds && !isConnected;

      return {
        id: `${e.source_id}-${e.target_id}`,
        source: e.source_id,
        target: e.target_id,
        style: {
          stroke: '#8dc75e',
          strokeWidth: isDimmed ? 0.5 : 1.5,
          opacity: isDimmed ? 0.2 : 1,
          transition: 'opacity 0.2s, stroke-width 0.2s',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#8dc75e',
          width: 15,
          height: 15,
        },
      };
    });

    setNodes(styledNodes);
    setEdges(styledEdges);

    // Pan to search match
    if (searchMatch && reactFlowInstance.current) {
      const matchNode = styledNodes.find((n) => n.id === searchMatch);
      if (matchNode) {
        setTimeout(() => {
          reactFlowInstance.current?.setCenter(
            matchNode.position.x,
            matchNode.position.y,
            { zoom: 1.5, duration: 500 }
          );
        }, 100);
      }
    }
  }, [
    hasLoaded,
    graphData,
    currentPageId,
    depthFilter,
    searchQuery,
    hoveredNode,
    setNodes,
    setEdges,
  ]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoaded(false);
      setHoveredNode(null);
      setSearchQuery('');
      setDepthFilter('all');
    }
  }, [isOpen]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onClose();
      router.push(`/page/${node.id}`);
    },
    [onClose, router]
  );

  // Handle node hover
  const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNode(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-void-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-warm-ivory/10 gap-4">
        <h2 className="text-lg font-display font-semibold text-warm-ivory flex-shrink-0">
          Graph View
        </h2>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full px-3 py-1.5 text-sm bg-warm-ivory/5 border border-warm-ivory/10 rounded text-warm-ivory placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-ivory/40 hover:text-warm-ivory"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Depth Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-warm-ivory/40">Depth:</span>
            {([1, 2, 3, 'all'] as DepthFilter[]).map((depth) => (
              <button
                key={depth}
                onClick={() => setDepthFilter(depth)}
                disabled={!currentPageId}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  depthFilter === depth
                    ? 'bg-tech-olive text-void-black font-medium'
                    : 'bg-warm-ivory/5 text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/10'
                } ${!currentPageId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {depth === 'all' ? 'All' : depth}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-warm-ivory/10 rounded transition-colors flex-shrink-0"
          title="Close (Esc)"
        >
          <svg
            className="w-5 h-5 text-warm-ivory/60 hover:text-warm-ivory"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Graph Container */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-warm-ivory/40">Loading graph...</div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <svg
              className="w-16 h-16 text-warm-ivory/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <p className="text-warm-ivory/40 text-center">
              No pages yet.
              <br />
              <span className="text-sm">
                Create pages and add connections to see the graph.
              </span>
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              animated: false,
            }}
          >
            <Background color="#261833" gap={24} />
            <Controls
              showInteractive={false}
              style={{
                bottom: 20,
                left: 20,
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-warm-ivory/10 text-xs text-warm-ivory/40 flex items-center gap-6">
        <span>Click node to navigate</span>
        <span>Hover to highlight connections</span>
        <span>Scroll to zoom</span>
        <span>Drag to pan</span>
        {currentPageId && (
          <span className="ml-auto flex items-center gap-2">
            <span className="w-3 h-3 bg-tech-olive rounded-sm" />
            Current page
          </span>
        )}
      </div>
    </div>
  );
}

export default GraphViewModal;
