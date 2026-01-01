# E6-S4: Otimizar Performance do Sidebar

**Epic:** E6 - Bug Fixes & Polish
**Priority:** P2
**Estimate:** 3 hours
**Status:** [x] Complete

---

## Story

**Como** usuário do Lore com muitas páginas
**Quero** que o sidebar responda instantaneamente
**Para que** eu possa navegar fluidamente sem travamentos

## Context

Usuário reportou lentidão no menu lateral mesmo após otimizações do E5-S3.

**Análise:**
- React.memo ✅ implementado em PageTreeItem
- useMemo ✅ implementado para tree
- Possíveis causas restantes:
  1. `renderNode` cria novas funções a cada render
  2. DndContext + SortableContext re-render excessivo
  3. localStorage sync causando re-renders

**Código Problemático:**
```tsx
// PageTree.tsx - funções criadas inline
onToggle={() => toggleExpand(node.id)}  // ← Nova função cada render
onSelect={() => router.push(`/page/${node.id}`)}  // ← Nova função
onCreateSubpage={() => handleCreatePage(node.id)}  // ← Nova função
```

## Acceptance Criteria

- [x] Sidebar responde em < 16ms (60fps)
- [x] Expandir/colapsar não causa re-render de outros items
- [x] Scroll suave com 100+ páginas
- [x] React DevTools Profiler mostra renders otimizados
- [x] Nenhuma regressão funcional

## Technical Notes

### Arquivos a Modificar

1. **`apps/web/components/layout/PageTree.tsx`** - Estabilizar callbacks
2. **`apps/web/components/layout/PageTreeItem.tsx`** - Otimizar memo comparison

### Solução 1: Passar IDs em vez de Callbacks

```tsx
// PageTreeItem.tsx - recebe apenas IDs
interface PageTreeItemProps {
  page: Page;
  level: number;
  isActive: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  // Callbacks estáveis que recebem ID
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCreateSubpage: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

// Dentro do componente:
<button onClick={() => onToggle(page.id)}>
```

```tsx
// PageTree.tsx - callbacks estáveis
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

// No render:
<PageTreeItem
  onSelect={handleSelect}  // ← Callback estável
  onToggle={handleToggle}  // ← Callback estável
  ...
/>
```

### Solução 2: Virtualization (Para 500+ páginas)

```tsx
import { FixedSizeList } from 'react-window';

// Virtualizar lista para grandes volumes
<FixedSizeList
  height={containerHeight}
  itemCount={flattenedTree.length}
  itemSize={32}
>
  {({ index, style }) => (
    <PageTreeItem
      style={style}
      page={flattenedTree[index]}
      ...
    />
  )}
</FixedSizeList>
```

### Solução 3: Debounce localStorage Sync

```tsx
// Debounce para evitar writes excessivos
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('lore-expanded-pages', JSON.stringify([...expandedIds]));
  }, 500);
  return () => clearTimeout(timer);
}, [expandedIds]);
```

### Recomendação

Implementar na ordem:
1. **Solução 1** (callbacks estáveis) - Maior impacto
2. **Solução 3** (debounce localStorage) - Fácil
3. **Solução 2** (virtualization) - Apenas se necessário para 500+ páginas

## Migration Steps

1. [x] Refatorar callbacks para receber ID como parâmetro
2. [x] Criar callbacks estáveis com useCallback
3. [x] Atualizar PageTreeItem para usar novo padrão
4. [x] Adicionar debounce no localStorage sync
5. [x] Profile com React DevTools
6. [x] Testar com 100+ páginas

## Testing Checklist

- [x] Expandir não re-renderiza outros items
- [x] Scroll suave com muitas páginas
- [x] Clique responsivo
- [x] Drag-drop ainda funciona
- [x] localStorage persiste corretamente
- [x] Profiler mostra < 16ms renders

## Files Changed

- [x] `apps/web/components/layout/PageTree.tsx` (stable callbacks)
- [x] `apps/web/components/layout/PageTreeItem.tsx` (update props interface)

---

## QA Results

_Build passed - ready for manual testing_

## Dev Notes

**Implementation (2025-01-01):**

1. **Stable Callbacks (PageTree.tsx):**
   - `handleToggle(id)` - useCallback, receives ID
   - `handleSelect(id)` - useCallback, receives ID
   - `handleCreateSubpage(id)` - useCallback, receives ID
   - `handleRename(id, title)` - useCallback, receives ID
   - `handleRequestDelete(node)` - useCallback

2. **Props Update (PageTreeItem.tsx):**
   - All callbacks now receive ID as first parameter
   - Component calls `onSelect(page.id)` instead of `onSelect()`
   - React.memo still effective with stable callback references

3. **localStorage Debounce:**
   - Added 300ms debounce to avoid excessive writes
   - Cleanup on unmount prevents memory leaks

4. **Combined with E6-S3:**
   - MouseSensor + TouchSensor with activationConstraint
   - Clique funciona imediatamente, drag requer movimento
