# E3-S2: Keyboard Shortcuts Guide

**Epic:** E3 - UX Polish & Navegação
**Priority:** P1
**Estimate:** 3 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** ver uma lista de atalhos de teclado disponíveis
**Para que** eu possa usar o app mais eficientemente

## Acceptance Criteria

- [ ] ⌘/ ou Ctrl+/ abre modal de atalhos
- [ ] Lista todos os atalhos organizados por categoria
- [ ] Design limpo e fácil de escanear
- [ ] Fechar com Escape ou click fora
- [ ] Dica sutil no rodapé "Press ⌘/ for shortcuts"

## Technical Notes

### Atalhos a documentar
```
Navigation
  ⌘K          Command palette
  ⌘N          New page
  ⌘/          Shortcuts (this modal)

Editor
  ⌘S          Save (auto-save enabled)
  ⌘B          Bold
  ⌘I          Italic
  [[          Link to page

AI Features (when enabled)
  Select + ⌘J   AI actions
  /image        Generate image
```

### Componente
```typescript
// components/KeyboardShortcutsModal.tsx
const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Command palette' },
      { keys: ['⌘', 'N'], description: 'New page' },
      { keys: ['⌘', '/'], description: 'Keyboard shortcuts' },
    ]
  },
  // ...
];
```

### Dica no rodapé
Adicionar em AppShell ou Sidebar footer:
```tsx
<span className="text-xs text-warm-ivory/30">
  Press ⌘/ for shortcuts
</span>
```

## Testing Checklist

- [ ] Modal abre com ⌘/
- [ ] Todos atalhos listados funcionam
- [ ] Modal fecha com Escape
- [ ] Responsivo em mobile

## Files Changed

- [ ] `apps/web/components/KeyboardShortcutsModal.tsx` (novo)
- [ ] `apps/web/components/layout/AppShell.tsx`
- [ ] `apps/web/components/layout/Sidebar.tsx`

---

## QA Results

_To be filled after implementation_
