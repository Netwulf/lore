# E2-S5: Otimizar CommandPalette Debounce

**Epic:** E2 - Performance & Otimização
**Priority:** P1
**Estimate:** 3 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que a busca seja rápida sem fazer requests desnecessários
**Para que** a experiência seja fluida

## Context

Atualmente o CommandPalette faz busca semântica (API call + embedding) a cada 300ms de digitação. Isso gera:
- Muitos requests desnecessários
- Latência percebida
- Custo de API (embeddings)

## Acceptance Criteria

- [ ] Busca local acontece imediatamente (client-side filter)
- [ ] Busca semântica só após 1000ms sem digitar OU Enter
- [ ] Indicador visual de "buscando semanticamente..."
- [ ] Resultados locais aparecem primeiro, semânticos depois
- [ ] Cancelar busca semântica ao continuar digitando

## Technical Notes

### Estratégia: Local-First
```typescript
// 1. Filtro local imediato
const localResults = pages.filter(p =>
  p.title.toLowerCase().includes(query.toLowerCase())
);

// 2. Semântica após delay ou Enter
const debouncedSemanticSearch = useDebouncedCallback(
  async (query) => {
    setIsSemanticSearching(true);
    const results = await semanticSearch(query);
    setSemanticResults(results);
    setIsSemanticSearching(false);
  },
  1000 // 1 segundo de delay
);

// 3. Enter força busca imediata
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !selectedItem) {
    debouncedSemanticSearch.flush(); // Executar imediatamente
  }
};
```

### AbortController para cancelar
```typescript
const abortControllerRef = useRef<AbortController>();

const semanticSearch = async (query) => {
  // Cancelar busca anterior
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  const response = await fetch('/api/ai/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
    signal: abortControllerRef.current.signal,
  });

  // ...
};
```

## UI States

```
Digitando: [query____]
           📄 Local Result 1
           📄 Local Result 2
           ⏳ Searching semantically...

Após 1s:   [query____]
           📄 Local Result 1
           📄 Local Result 2
           ✨ Semantic Result 1
           ✨ Semantic Result 2
```

## Testing Checklist

- [ ] Resultados locais aparecem instantaneamente
- [ ] Semânticos aparecem após delay
- [ ] Enter acelera busca semântica
- [ ] Digitar cancela busca em andamento
- [ ] Sem requests duplicados

## Files Changed

- [ ] `apps/web/components/layout/CommandPalette.tsx`

---

## QA Results

_To be filled after implementation_
