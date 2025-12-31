# E5-S4: Otimizar Semantic Search Debounce

**Epic:** E5 - Performance Critical
**Priority:** P1
**Estimate:** 1 hour
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que a busca responda mais rápido
**Para que** eu encontre páginas sem esperar 1 segundo

## Context

Auditoria técnica revelou que o debounce de semantic search é muito longo:

```typescript
// CommandPalette.tsx linhas 131-160
searchTimeoutRef.current = setTimeout(() => {
  performSemanticSearch(query);
}, 1000);  // ← 1 segundo é perceptível como lag
```

**Impacto:**
- Usuário digita "react" → espera 1s → vê resultados
- Sensação de app lento
- UX moderna espera 200-300ms

## Acceptance Criteria

- [ ] Debounce reduzido para 300ms
- [ ] Resultados locais aparecem imediatamente (0ms)
- [ ] Semantic results aparecem após 300ms
- [ ] Indicador visual durante busca semântica
- [ ] AbortController limpo corretamente

## Technical Notes

### Estratégia: Instant Local + Delayed Semantic

```typescript
// CommandPalette.tsx

const SEMANTIC_DEBOUNCE = 300; // Reduzido de 1000ms

// Resultados locais imediatos
useEffect(() => {
  if (query.length >= 2) {
    // Filtro local instantâneo
    const localResults = pages
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        preview: '',
        similarity: null,
        isSemanticResult: false
      }));
    setSearchResults(localResults);
  }
}, [query, pages]);

// Semantic com debounce curto
useEffect(() => {
  if (query.length < 2) return;

  const timer = setTimeout(() => {
    performSemanticSearch(query);
  }, SEMANTIC_DEBOUNCE);

  return () => clearTimeout(timer);
}, [query]);
```

### Fix AbortController Cleanup

```typescript
// Cleanup adequado
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
}, []);
```

### Indicador Visual

```typescript
{isSearching && (
  <div className="flex items-center gap-2 px-3 py-2 text-warm-ivory/40">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Searching with AI...</span>
  </div>
)}
```

## Migration Steps

1. [ ] Reduzir debounce de 1000ms para 300ms
2. [ ] Separar local search (instant) de semantic (debounced)
3. [ ] Fix cleanup do AbortController
4. [ ] Adicionar indicador de loading
5. [ ] Testar UX da busca

## Testing Checklist

- [ ] Digitar mostra resultados locais instantâneos
- [ ] Semantic results aparecem após ~300ms
- [ ] Cancelar busca (fechar palette) não causa errors
- [ ] Múltiplas buscas rápidas não quebram
- [ ] Indicador de loading visível

## Files Changed

- [ ] `apps/web/components/layout/CommandPalette.tsx` (refactor search logic)

---

## QA Results

_To be filled after implementation_
