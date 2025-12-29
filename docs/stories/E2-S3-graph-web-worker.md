# E2-S3: Graph Layout em Web Worker

**Epic:** E2 - Performance & Otimização
**Priority:** P0
**Estimate:** 8 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que o cálculo do Graph não trave a interface
**Para que** eu possa continuar interagindo enquanto o graph carrega

## Context

Atualmente o GraphViewModal executa 300 iterações do d3-force sincronamente, bloqueando a main thread por ~500ms.

```typescript
// Código atual problemático
for (let i = 0; i < 300; i++) {
  simulation.tick();
}
```

## Acceptance Criteria

- [ ] Cálculo de layout roda em Web Worker
- [ ] UI permanece responsiva durante cálculo
- [ ] Progress indicator durante cálculo
- [ ] Resultado transferido via postMessage
- [ ] Fallback para sync se Worker indisponível

## Technical Notes

### Estrutura
```
components/graph/
├── GraphViewModal.tsx      (UI principal)
├── GraphViewContent.tsx    (lógica React)
├── graphWorker.ts          (Web Worker)
└── useGraphLayout.ts       (hook para comunicação)
```

### Web Worker (graphWorker.ts)
```typescript
// graphWorker.ts
import * as d3 from 'd3-force';

self.onmessage = (e: MessageEvent) => {
  const { nodes, links } = e.data;

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(400, 300));

  for (let i = 0; i < 300; i++) {
    simulation.tick();
    // Reportar progresso a cada 10%
    if (i % 30 === 0) {
      self.postMessage({ type: 'progress', value: i / 300 });
    }
  }

  simulation.stop();

  self.postMessage({
    type: 'complete',
    nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
    links
  });
};
```

### Hook (useGraphLayout.ts)
```typescript
export function useGraphLayout(nodes, links) {
  const [layout, setLayout] = useState(null);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./graphWorker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress(e.data.value);
      } else if (e.data.type === 'complete') {
        setLayout(e.data);
      }
    };

    workerRef.current.postMessage({ nodes, links });

    return () => workerRef.current?.terminate();
  }, [nodes, links]);

  return { layout, progress, isCalculating: !layout };
}
```

### Next.js Config
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' },
    });
    return config;
  },
};
```

## Performance Target

| Metric | Before | After |
|--------|--------|-------|
| Main thread block | ~500ms | 0ms |
| Total calculation | ~500ms | ~500ms |
| UI responsiveness | Frozen | Smooth |

## Testing Checklist

- [ ] Graph renderiza corretamente
- [ ] UI não trava durante cálculo
- [ ] Progress indicator funciona
- [ ] Filtros de profundidade funcionam
- [ ] Hover highlighting funciona

## Files Changed

- [ ] `apps/web/components/graph/graphWorker.ts` (novo)
- [ ] `apps/web/components/graph/useGraphLayout.ts` (novo)
- [ ] `apps/web/components/graph/GraphViewContent.tsx`
- [ ] `apps/web/next.config.js`

---

## QA Results

_To be filled after implementation_
