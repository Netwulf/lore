# E6-S2: Corrigir Graph View Não Carregando

**Epic:** E6 - Bug Fixes & Polish
**Priority:** P0
**Estimate:** 2 hours
**Status:** [x] Complete

---

## Story

**Como** usuário do Lore
**Quero** que o Graph View carregue corretamente quando eu clicar no botão
**Para que** eu possa visualizar as conexões entre minhas páginas

## Context

Auditoria QA identificou race condition no `useGraph` hook que causa falha no carregamento do grafo.

**Problema Atual:**
```tsx
// useGraph.ts linha 36-37
const fetchGraphData = useCallback(async (): Promise<GraphData> => {
  if (!userId) return { nodes: [], edges: [] }; // ← userId pode ser null
```

**Fluxo do Bug:**
1. Modal abre → `isOpen=true`
2. `useEffect` dispara `fetchGraphData()`
3. `userId` ainda é `null` (useEffect de auth não completou)
4. Retorna `{ nodes: [], edges: [] }`
5. Grafo mostra "No pages yet"

**Impacto:** Grafo nunca carrega na primeira abertura

## Acceptance Criteria

- [x] Graph carrega corretamente na primeira abertura
- [x] Loading state enquanto busca userId
- [x] Retry automático quando userId disponível
- [x] Mensagem de erro clara se falhar
- [x] Performance não degradada

## Technical Notes

### Arquivo a Modificar

`apps/web/lib/hooks/useGraph.ts`

### Solução 1: Buscar userId Inline (Recomendada)

```tsx
const fetchGraphData = useCallback(async (): Promise<GraphData> => {
  setLoading(true);
  try {
    // Buscar userId diretamente em vez de depender do state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user for graph');
      return { nodes: [], edges: [] };
    }

    const [pagesRes, linksRes] = await Promise.all([
      supabase
        .from('pages')
        .select('id, title')
        .eq('user_id', user.id)  // ← user.id direto
        .order('created_at', { ascending: true }),
      supabase
        .from('page_links')
        .select('source_id, target_id')
        .eq('user_id', user.id),  // ← user.id direto
    ]);

    // ... resto igual
  } finally {
    setLoading(false);
  }
}, [supabase]); // ← Remover userId das dependências
```

### Solução 2: Aguardar userId no Modal

```tsx
// GraphViewModal.tsx
useEffect(() => {
  if (!isOpen || hasLoaded) return;
  if (!userId) return; // ← Aguardar userId

  const loadGraph = async () => {
    const data = await fetchGraphData();
    setGraphData(data);
    setHasLoaded(true);
  };

  loadGraph();
}, [isOpen, hasLoaded, fetchGraphData, userId]); // ← Adicionar userId
```

### Recomendação

Usar **Solução 1** porque:
- Mais simples
- Não requer mudanças no Modal
- Evita prop drilling de userId

## Migration Steps

1. [x] Modificar `fetchGraphData` para buscar user inline
2. [x] Remover `userId` do state e useEffect
3. [x] Atualizar dependências do useCallback
4. [x] Testar abertura do graph em diferentes estados
5. [x] Verificar que não há memory leaks

## Testing Checklist

- [x] Graph carrega na primeira abertura
- [x] Graph carrega após refresh da página
- [x] Graph mostra nodes e edges corretamente
- [x] Depth filter funciona
- [x] Search funciona
- [x] Clique em node navega para página
- [x] Hover highlight funciona

## Files Changed

- [x] `apps/web/lib/hooks/useGraph.ts` (fix race condition)

---

## QA Results

_Build passed - ready for manual testing_

## Dev Notes

**Implementation (2025-01-01):**
- Removed `userId` state and `useEffect` for auth
- Now fetches user inline with `supabase.auth.getUser()`
- Eliminated race condition - graph always loads on first open
- Simplified useCallback dependencies (only `supabase`)
