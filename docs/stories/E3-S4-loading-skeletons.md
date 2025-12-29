# E3-S4: Loading Skeletons

**Epic:** E3 - UX Polish & Navegação
**Priority:** P2
**Estimate:** 3 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** ver feedback visual enquanto o conteúdo carrega
**Para que** eu saiba que o app está funcionando

## Acceptance Criteria

- [ ] Skeleton para lista de páginas no sidebar
- [ ] Skeleton para editor enquanto carrega página
- [ ] Skeleton para chat messages
- [ ] Animação pulse suave
- [ ] Transição suave skeleton → conteúdo

## Technical Notes

### Componente base
```typescript
// components/ui/Skeleton.tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-warm-ivory/5 rounded",
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}
```

### Uso no PageTree
```tsx
if (loading) {
  return (
    <div className="space-y-2 p-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-2/3" />
    </div>
  );
}
```

### Uso no Editor
```tsx
// PageEditor loading state
<div className="max-w-4xl mx-auto px-6 py-8">
  <Skeleton className="h-10 w-1/2 mb-4" />
  <SkeletonText lines={5} />
</div>
```

## Testing Checklist

- [ ] Skeletons aparecem durante load
- [ ] Transição suave para conteúdo
- [ ] Sem flash ou layout shift

## Files Changed

- [ ] `apps/web/components/ui/Skeleton.tsx` (novo)
- [ ] `apps/web/components/layout/PageTree.tsx`
- [ ] `apps/web/components/editor/PageEditor.tsx`
- [ ] `apps/web/components/chat/ChatSidebar.tsx`

---

## QA Results

_To be filled after implementation_
