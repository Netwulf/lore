# E1-S1: Criar Botão "+" para Nova Página

**Epic:** E1 - Simplificação da UI
**Priority:** P0
**Estimate:** 2 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** um botão visível para criar nova página
**Para que** eu possa começar a escrever imediatamente sem procurar como fazer

## Context

Atualmente não existe forma óbvia de criar uma nova página. O usuário precisa:
1. Usar CommandPalette (⌘K)
2. Ou clicar com botão direito na árvore

Obsidian e Notion têm botão "+" sempre visível.

## Acceptance Criteria

- [x] Botão "+" visível no topo do Sidebar (ao lado do título "Lore")
- [x] Ao clicar, cria página "Untitled" e navega para ela
- [x] Nova página é filha do root (sem parent)
- [x] Foco automático no título após criar
- [x] Atalho ⌘N também funciona

## Technical Notes

### Arquivo a modificar
`apps/web/components/layout/Sidebar.tsx`

### Implementação sugerida
```tsx
// No header do Sidebar, adicionar:
<button
  onClick={handleCreatePage}
  className="p-1.5 hover:bg-warm-ivory/10 rounded"
  title="New page (⌘N)"
>
  <PlusIcon className="w-4 h-4 text-warm-ivory/60" />
</button>
```

### Keyboard shortcut
Adicionar listener em `AppShell.tsx` para ⌘N

## Design Reference

```
┌─────────────────────────┐
│ Lore            [+] [⚙] │  ← Botão + aqui
├─────────────────────────┤
│ 📄 Page 1               │
│ 📄 Page 2               │
│   └─ 📄 Subpage         │
└─────────────────────────┘
```

## Testing Checklist

- [ ] Click no botão cria página
- [ ] ⌘N cria página
- [ ] Página aparece no sidebar
- [ ] Navegação automática funciona
- [ ] Título recebe foco

## Files Changed

- [ ] `apps/web/components/layout/Sidebar.tsx`
- [ ] `apps/web/components/layout/AppShell.tsx` (keyboard shortcut)

---

## QA Results

_To be filled after implementation_

## Dev Notes

_To be filled during implementation_
