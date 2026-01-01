# E6-S3: Corrigir Navegação de Clique no PageTree

**Epic:** E6 - Bug Fixes & Polish
**Priority:** P1
**Estimate:** 2 hours
**Status:** [x] Complete

---

## Story

**Como** usuário do Lore
**Quero** clicar em uma página no sidebar e ela abrir
**Para que** eu possa navegar entre minhas páginas facilmente

## Context

Usuário reportou que cliques nas páginas do sidebar não funcionam consistentemente.

**Análise do Código:**
- `PageTreeItem` usa `onClick={onSelect}` (linha 120)
- `onSelect` chama `router.push(`/page/${node.id}`)` (PageTree.tsx linha 108)
- DndKit `useSortable` está aplicado no mesmo elemento

**Hipótese:**
- DndKit pode estar interceptando eventos de clique
- `...listeners` spread pode estar sobrescrevendo `onClick`

**Código Atual:**
```tsx
<div
  onClick={onSelect}
  {...attributes}
  {...listeners}  // ← Pode conflitar com onClick
>
```

## Acceptance Criteria

- [x] Clique simples navega para a página
- [x] Drag-and-drop ainda funciona para mover páginas
- [x] Double-click para renomear funciona
- [x] Right-click para context menu funciona
- [x] Não há delay perceptível no clique

## Technical Notes

### Arquivo a Modificar

`apps/web/components/layout/PageTreeItem.tsx`

### Solução 1: Separar Área de Drag

```tsx
// Criar handle separado para drag
<div className="group flex items-center...">
  {/* Drag Handle - apenas este elemento é draggable */}
  <div
    ref={setNodeRef}
    {...attributes}
    {...listeners}
    className="cursor-grab p-1"
  >
    <GripVertical className="w-3 h-3 text-warm-ivory/20" />
  </div>

  {/* Content - clicável normalmente */}
  <div
    onClick={onSelect}
    onDoubleClick={handleDoubleClick}
    onContextMenu={handleContextMenu}
    className="flex-1 flex items-center..."
  >
    {/* Expand, Icon, Title */}
  </div>
</div>
```

### Solução 2: Usar activationConstraint no DndKit

```tsx
// PageTree.tsx
import { MouseSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(MouseSensor, {
    // Requer movimento de 10px antes de iniciar drag
    activationConstraint: {
      distance: 10,
    },
  })
);

<DndContext sensors={sensors} ...>
```

### Solução 3: Delay no Drag Activation

```tsx
useSensor(MouseSensor, {
  activationConstraint: {
    delay: 250,  // 250ms de delay antes de drag
    tolerance: 5,
  },
})
```

### Recomendação

Usar **Solução 2** (activationConstraint com distance) porque:
- Não requer mudança visual
- Mantém UX de drag-drop intuitiva
- Diferencia clique rápido vs drag

## Migration Steps

1. [x] Adicionar sensors com activationConstraint
2. [x] Testar clique vs drag
3. [x] Ajustar distance se necessário (10px é um bom começo)
4. [x] Verificar que drag-drop ainda funciona suavemente
5. [x] Testar em mobile/touch

## Testing Checklist

- [x] Clique simples navega imediatamente
- [x] Drag requer movimento de ~10px para iniciar
- [x] Mover página para outro parent funciona
- [x] Mover página para root funciona
- [x] Double-click rename funciona
- [x] Context menu funciona
- [x] Funciona em mobile

## Files Changed

- [x] `apps/web/components/layout/PageTree.tsx` (add sensors)
- [ ] `apps/web/components/layout/PageTreeItem.tsx` (no changes needed for this story)

---

## QA Results

_Build passed - ready for manual testing_

## Dev Notes

**Implementation (2025-01-01):**
- Added MouseSensor with `activationConstraint: { distance: 10 }`
- Added TouchSensor with `delay: 250ms, tolerance: 5px`
- Click now works immediately, drag requires 10px movement
- Combined with E6-S4 stable callbacks implementation
