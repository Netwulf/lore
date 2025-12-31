# E5-S3: Memoize Tree Building + React.memo

**Epic:** E5 - Performance Critical
**Priority:** P0
**Estimate:** 2 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore com muitas páginas
**Quero** que a sidebar não trave ao navegar
**Para que** eu possa trabalhar fluidamente com 100+ páginas

## Context

Auditoria técnica revelou dois problemas em `PageTree.tsx`:

**Problema 1: Tree rebuild a cada render**
```typescript
// usePagesQuery.ts linhas 54-71
const buildTree = useCallback((pages: Page[]): PageTreeNode[] => {
  // Cria novos objetos TODA VEZ que pages muda
  const map = new Map<string, PageTreeNode>();
  // ...
}, []);
```

**Problema 2: PageTreeItem sem React.memo**
```typescript
// PageTree.tsx linhas 55-69
const renderNode = (node) => (
  <PageTreeItem {...props} />  // ← Re-renderiza TODOS os items
);
```

**Impacto:** Com 100+ páginas, cada navegação/update causa:
- Rebuild completo da árvore (O(n))
- Re-render de todos os PageTreeItem
- UI lag visível

## Acceptance Criteria

- [ ] Tree memoizada com useMemo baseado em pages hash
- [ ] PageTreeItem wrapped com React.memo
- [ ] Comparison function customizada para memo
- [ ] Zero re-renders desnecessários (verificar DevTools)
- [ ] Performance com 500 páginas < 16ms render

## Technical Notes

### Fix 1: Memoize Tree com Hash

```typescript
// usePagesQuery.ts
import { useMemo } from 'react';

export function usePagesQuery() {
  // ...

  // Memoize tree based on pages array reference
  const tree = useMemo(() => {
    if (pages.length === 0) return [];
    return buildTree(pages);
  }, [pages, buildTree]);

  return {
    pages,
    tree,  // ← Agora memoizado
    // ...
  };
}
```

### Fix 2: React.memo no PageTreeItem

```typescript
// components/layout/PageTreeItem.tsx
import { memo } from 'react';

interface PageTreeItemProps {
  node: PageTreeNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

function PageTreeItemComponent({
  node,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onCreateChild,
  onDelete
}: PageTreeItemProps) {
  // ... existing implementation
}

// Custom comparison - only re-render if these change
export const PageTreeItem = memo(PageTreeItemComponent, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.title === next.node.title &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded &&
    prev.level === next.level
  );
});
```

### Fix 3: Stable Callbacks

```typescript
// PageTree.tsx
const handleSelect = useCallback((id: string) => {
  router.push(`/page/${id}`);
}, [router]);

const handleToggle = useCallback((id: string) => {
  setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}, []);
```

### Performance Verification

```typescript
// Adicionar em dev mode
useEffect(() => {
  console.log('PageTree rendered');
}, []);

// React DevTools > Profiler > "Highlight updates"
```

## Migration Steps

1. [ ] Adicionar useMemo ao tree em usePagesQuery
2. [ ] Criar PageTreeItem como componente separado se não existir
3. [ ] Wrap PageTreeItem com React.memo
4. [ ] Adicionar comparison function
5. [ ] Estabilizar callbacks com useCallback
6. [ ] Testar com React DevTools Profiler

## Testing Checklist

- [ ] Expandir/colapsar não causa full re-render
- [ ] Selecionar página não re-renderiza outras
- [ ] Drag-drop não trava UI
- [ ] Profile mostra < 16ms render time
- [ ] 500 páginas navegáveis sem lag

## Files Changed

- [ ] `apps/web/lib/hooks/usePagesQuery.ts` (add useMemo)
- [ ] `apps/web/components/layout/PageTree.tsx` (refactor)
- [ ] `apps/web/components/layout/PageTreeItem.tsx` (NEW or refactor)

---

## QA Results

_To be filled after implementation_
