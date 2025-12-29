# E3-S5: Tooltip "Type [[ to link"

**Epic:** E3 - UX Polish & Navegação
**Priority:** P2
**Estimate:** 2 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** saber como criar links entre páginas
**Para que** eu possa conectar minhas ideias

## Acceptance Criteria

- [ ] Tooltip aparece na primeira vez que usuário edita
- [ ] Mostra "Type [[ to link pages"
- [ ] Dismissível com click ou após criar primeiro link
- [ ] Não aparece novamente após dismiss
- [ ] Armazenado em localStorage

## Technical Notes

### Implementação
```typescript
// components/editor/WikiLinkTooltip.tsx
export function WikiLinkTooltip() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('wikilink-tooltip-dismissed');
  });

  if (!show) return null;

  return (
    <div className="absolute top-2 right-2 p-2 bg-twilight-violet border border-warm-ivory/20 rounded text-sm">
      <p className="text-warm-ivory/80">
        Type <code className="bg-warm-ivory/10 px-1 rounded">[[</code> to link pages
      </p>
      <button
        onClick={() => {
          setShow(false);
          localStorage.setItem('wikilink-tooltip-dismissed', 'true');
        }}
        className="text-xs text-warm-ivory/40 hover:text-warm-ivory mt-1"
      >
        Got it
      </button>
    </div>
  );
}
```

### Integração no Editor
```tsx
// PageEditor.tsx
<div ref={editorContainerRef} className="relative">
  <WikiLinkTooltip />
  <Editor ... />
</div>
```

## Testing Checklist

- [ ] Tooltip aparece na primeira edição
- [ ] Dismiss funciona
- [ ] Não reaparece após dismiss
- [ ] Funciona após reload

## Files Changed

- [ ] `apps/web/components/editor/WikiLinkTooltip.tsx` (novo)
- [ ] `apps/web/components/editor/PageEditor.tsx`

---

## QA Results

_To be filled after implementation_
