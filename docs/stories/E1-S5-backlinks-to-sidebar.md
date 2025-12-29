# E1-S5: Mover Backlinks para Sidebar

**Epic:** E1 - Simplificação da UI
**Priority:** P1
**Estimate:** 4 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** que backlinks não apareçam no editor principal
**Para que** a área de escrita fique limpa

## Acceptance Criteria

- [x] BacklinksPanel removido do PageEditor
- [x] Backlinks aparecem no sidebar na seção PAGE INFO
- [x] Mostrar como lista colapsável
- [x] Contador de backlinks visível mesmo colapsado
- [x] Click no backlink navega para página

## Technical Notes

### Estrutura no Sidebar
```
┌─────────────────────────┐
│ PAGE INFO               │
│ Tags: [tag1] [+]        │
│ ▸ Backlinks (3)         │  ← Colapsado
│   • Page A              │  ← Expandido
│   • Page B              │
│   • Page C              │
└─────────────────────────┘
```

### Componente
Reutilizar lógica do BacklinksPanel existente, apenas mudar local.

## Files Changed

- [ ] `apps/web/components/editor/PageEditor.tsx` (remover)
- [ ] `apps/web/components/layout/PageInfoPanel.tsx` (adicionar)
- [ ] `apps/web/components/editor/BacklinksPanel.tsx` (refatorar)

---

## QA Results

_To be filled after implementation_
