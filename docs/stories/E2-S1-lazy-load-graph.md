# E2-S1: Lazy Load GraphViewModal

**Epic:** E2 - Performance & Otimização
**Priority:** P0
**Estimate:** 4 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** que o Graph View só carregue quando eu abrir
**Para que** o app carregue mais rápido inicialmente

## Context

O `reactflow` é uma dependência pesada (~200KB). Atualmente é importado mesmo que o usuário nunca abra o Graph View.

## Acceptance Criteria

- [x] GraphViewModal usa dynamic import
- [x] Loading spinner enquanto carrega o módulo
- [x] Reactflow só incluído no bundle quando modal abre
- [x] Sem flash ou layout shift ao abrir
- [x] Tempo de abertura do modal < 1s

## Technical Notes

### Implementação com dynamic import
```typescript
// components/graph/GraphViewModal.tsx
import dynamic from 'next/dynamic';

const GraphViewContent = dynamic(
  () => import('./GraphViewContent'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    ),
    ssr: false,
  }
);

export function GraphViewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <GraphViewContent />
    </Modal>
  );
}
```

### Separar GraphViewContent
Mover toda a lógica de d3-force e reactflow para um novo arquivo `GraphViewContent.tsx`.

## Bundle Analysis

```
Before: Main bundle includes reactflow (~200KB)
After: reactflow loaded on-demand (~200KB separate chunk)
```

## Testing Checklist

- [ ] App load time melhorou
- [ ] Graph abre sem erro
- [ ] Loading state visível
- [ ] Graph funcional após carregar

## Files Changed

- [ ] `apps/web/components/graph/GraphViewModal.tsx` (split)
- [ ] `apps/web/components/graph/GraphViewContent.tsx` (novo)

---

## QA Results

_To be filled after implementation_
