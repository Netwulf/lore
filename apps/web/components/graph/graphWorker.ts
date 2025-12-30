/**
 * Web Worker for d3-force graph layout calculation
 * Offloads CPU-intensive force simulation from main thread
 */
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';

interface WorkerNode extends SimulationNodeDatum {
  id: string;
  title: string;
}

interface WorkerLink extends SimulationLinkDatum<WorkerNode> {
  source: string | WorkerNode;
  target: string | WorkerNode;
}

interface WorkerInput {
  nodes: Array<{ id: string; title: string }>;
  links: Array<{ source_id: string; target_id: string }>;
  width: number;
  height: number;
}

interface ProgressMessage {
  type: 'progress';
  value: number;
}

interface CompleteMessage {
  type: 'complete';
  nodes: Array<{ id: string; title: string; x: number; y: number }>;
}

type WorkerOutput = ProgressMessage | CompleteMessage;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { nodes, links, width, height } = e.data;

  if (nodes.length === 0) {
    self.postMessage({ type: 'complete', nodes: [] } as WorkerOutput);
    return;
  }

  // Initialize nodes with random positions
  const simNodes: WorkerNode[] = nodes.map((n) => ({
    id: n.id,
    title: n.title,
    x: width / 2 + (Math.random() - 0.5) * 200,
    y: height / 2 + (Math.random() - 0.5) * 200,
  }));

  // Convert links to d3 format
  const simLinks: WorkerLink[] = links.map((l) => ({
    source: l.source_id,
    target: l.target_id,
  }));

  // Create force simulation
  const simulation = forceSimulation<WorkerNode>(simNodes)
    .force(
      'link',
      forceLink<WorkerNode, WorkerLink>(simLinks)
        .id((d) => d.id)
        .distance(120)
    )
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide().radius(60));

  const totalIterations = 300;
  const progressInterval = 30; // Report every 10%

  // Run simulation with progress updates
  for (let i = 0; i < totalIterations; i++) {
    simulation.tick();

    // Report progress every 10%
    if (i % progressInterval === 0) {
      self.postMessage({
        type: 'progress',
        value: i / totalIterations,
      } as WorkerOutput);
    }
  }

  simulation.stop();

  // Send final result
  self.postMessage({
    type: 'complete',
    nodes: simNodes.map((node) => ({
      id: node.id,
      title: node.title,
      x: node.x ?? 0,
      y: node.y ?? 0,
    })),
  } as WorkerOutput);
};

export {};
