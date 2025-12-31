# E5-S1: Consolidar usePages em usePagesQuery

**Epic:** E5 - Performance Critical
**Priority:** P0
**Estimate:** 2 hours
**Status:** [ ] Not Started

---

## Story

**Como** desenvolvedor do Lore
**Quero** consolidar usePages e usePagesQuery em um único hook
**Para que** tenhamos cache consistente e zero chamadas duplicadas

## Context

Auditoria técnica revelou que existem dois hooks paralelos:
- `usePages.ts` - useState manual, sem cache
- `usePagesQuery.ts` - React Query com caching

Componentes usam ambos inconsistentemente:
- `PageEditor.tsx` usa `usePages()` (linha 29)
- `PageTree.tsx` usa `usePages()` (linha 18)
- `usePagesQuery` existe mas não é usado globalmente

**Impacto:** Cache inconsistente, requests duplicados, memória desperdiçada.

## Acceptance Criteria

- [ ] `usePages.ts` removido completamente
- [ ] Todos componentes usando `usePagesQuery`
- [ ] API de retorno mantida (backward compatible)
- [ ] Cache funcionando (verificar DevTools)
- [ ] Zero breaking changes no comportamento
- [ ] Nenhum console.error após migração

## Technical Notes

### Arquivos a Modificar

1. **Remover:** `lib/hooks/usePages.ts`
2. **Manter:** `lib/hooks/usePagesQuery.ts` (renomear export para `usePages`)
3. **Atualizar imports em:**
   - `components/editor/PageEditor.tsx`
   - `components/layout/PageTree.tsx`
   - `components/layout/AppShell.tsx`
   - Qualquer outro que importe usePages

### Estratégia de Migração

```typescript
// usePagesQuery.ts - adicionar alias
export { usePagesQuery as usePages };
export default usePagesQuery;
```

### Verificação de Cache
```typescript
// Testar que staleTime está funcionando
// Abrir DevTools > React Query > Observers
// Deve mostrar 1 observer, não múltiplos
```

## Migration Steps

1. [ ] Listar todos imports de usePages no projeto
2. [ ] Verificar API de retorno é compatível
3. [ ] Adicionar export alias em usePagesQuery
4. [ ] Atualizar imports um a um
5. [ ] Deletar usePages.ts
6. [ ] Testar todos fluxos

## Testing Checklist

- [ ] Criar página funciona
- [ ] Deletar página funciona
- [ ] Renomear página funciona
- [ ] Mover página (drag-drop) funciona
- [ ] Cache compartilhado entre componentes
- [ ] Refresh não quebra nada

## Files Changed

- [ ] `apps/web/lib/hooks/usePages.ts` (DELETE)
- [ ] `apps/web/lib/hooks/usePagesQuery.ts` (add alias export)
- [ ] `apps/web/components/editor/PageEditor.tsx` (update import)
- [ ] `apps/web/components/layout/PageTree.tsx` (update import)
- [ ] `apps/web/components/layout/AppShell.tsx` (update import)

---

## QA Results

_To be filled after implementation_
