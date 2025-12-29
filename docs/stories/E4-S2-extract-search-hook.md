# E4-S2: Extrair Search Logic do CommandPalette

**Epic:** E4 - Arquitetura & Refactoring
**Priority:** P1
**Estimate:** 4 hours
**Status:** [ ] Not Started

---

## Story

**Como** desenvolvedor do Lore
**Quero** que a lógica de busca esteja em um hook separado
**Para que** possa ser reutilizada e testada independentemente

## Context

O CommandPalette.tsx tem 391 linhas com lógica de:
- Busca local (filter)
- Busca semântica (API call)
- Debouncing
- Keyboard navigation
- UI rendering

A busca deveria ser extraída para um hook reutilizável.

## Acceptance Criteria

- [ ] Hook useSearch extraído
- [ ] CommandPalette usa hook
- [ ] Busca pode ser usada em outros lugares
- [ ] Testes unitários para hook
- [ ] Sem mudança de comportamento

## Technical Notes

### Hook useSearch
```typescript
// hooks/useSearch.ts
interface UseSearchOptions {
  pages: Page[];
  debounceMs?: number;
  enableSemantic?: boolean;
}

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  isSemanticSearching: boolean;
}

export function useSearch(options: UseSearchOptions): UseSearchResult {
  const { pages, debounceMs = 300, enableSemantic = true } = options;

  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);

  // Local search (immediate)
  useEffect(() => {
    if (!query) {
      setLocalResults([]);
      return;
    }
    const filtered = pages.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
    setLocalResults(filtered.map(p => ({ ...p, type: 'local' })));
  }, [query, pages]);

  // Semantic search (debounced)
  const debouncedSemanticSearch = useDebouncedCallback(async (q: string) => {
    if (!enableSemantic || !q) return;
    setIsSemanticSearching(true);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      });
      const data = await response.json();
      setSemanticResults(data.results.map(r => ({ ...r, type: 'semantic' })));
    } finally {
      setIsSemanticSearching(false);
    }
  }, debounceMs);

  useEffect(() => {
    debouncedSemanticSearch(query);
  }, [query]);

  // Merge results (local first, then semantic)
  const results = useMemo(() => {
    const seen = new Set(localResults.map(r => r.id));
    const unique = semanticResults.filter(r => !seen.has(r.id));
    return [...localResults, ...unique];
  }, [localResults, semanticResults]);

  return {
    query,
    setQuery,
    results,
    isSearching: !!query,
    isSemanticSearching,
  };
}
```

### CommandPalette simplificado
```typescript
// CommandPalette.tsx (~200 lines, down from 391)
export function CommandPalette({ pages }) {
  const { query, setQuery, results, isSemanticSearching } = useSearch({
    pages,
    debounceMs: 1000,
    enableSemantic: aiEnabled,
  });

  const { selectedIndex, handleKeyDown } = useKeyboardNavigation(results);

  // UI only
  return (
    <Dialog>
      <Input value={query} onChange={setQuery} onKeyDown={handleKeyDown} />
      <ResultsList results={results} selectedIndex={selectedIndex} />
      {isSemanticSearching && <SearchingIndicator />}
    </Dialog>
  );
}
```

## Testing Checklist

- [ ] Hook retorna resultados corretos
- [ ] Debounce funciona
- [ ] Semantic search chamado após delay
- [ ] Results mergeados corretamente
- [ ] CommandPalette funciona igual

## Files Changed

- [ ] `apps/web/lib/hooks/useSearch.ts` (novo)
- [ ] `apps/web/components/layout/CommandPalette.tsx` (refactor)

---

## QA Results

_To be filled after implementation_
