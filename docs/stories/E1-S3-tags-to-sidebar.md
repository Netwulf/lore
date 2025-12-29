# E1-S3: Mover Tags para Sidebar

**Epic:** E1 - Simplificação da UI
**Priority:** P1
**Estimate:** 4 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que as tags não apareçam no editor principal
**Para que** eu possa focar na escrita sem distrações visuais

## Context

Atualmente as tags aparecem logo abaixo do título no editor, ocupando espaço visual e distraindo da escrita. Obsidian e Notion mostram metadados em painéis laterais ou em hover.

## Acceptance Criteria

- [ ] Tags removidas do PageEditor
- [ ] Tags aparecem no sidebar quando página está selecionada
- [ ] Seção "Page Info" no sidebar com tags e metadata
- [ ] Editar tags continua funcional no sidebar
- [ ] AI suggest tags funciona do sidebar

## Technical Notes

### Componentes a modificar

1. **PageEditor.tsx** - Remover `<PageTags />`
2. **Sidebar.tsx** - Adicionar seção PageInfo
3. **Criar PageInfoPanel.tsx** - Novo componente

### Nova estrutura do Sidebar
```
┌─────────────────────────┐
│ Lore                [+] │
├─────────────────────────┤
│ PAGES                   │
│ 📄 Page 1               │
│ 📄 Page 2 ← selected    │
├─────────────────────────┤
│ PAGE INFO               │  ← Nova seção
│ Tags: [tag1] [tag2] [+] │
│ Created: Dec 29, 2025   │
│ Modified: 2 min ago     │
├─────────────────────────┤
│ TAGS                    │
│ ▸ All Tags (12)         │
└─────────────────────────┘
```

### Props necessárias
```typescript
interface PageInfoPanelProps {
  pageId: string | null;
  pageTitle: string;
}
```

## Design Decisions

- Tags aparecem só quando uma página está aberta
- Se nenhuma página selecionada, seção "PAGE INFO" não aparece
- Manter funcionalidade de AI suggest tags

## Testing Checklist

- [ ] Tags não aparecem mais no editor
- [ ] Tags aparecem no sidebar quando página aberta
- [ ] Adicionar/remover tags funciona
- [ ] AI suggest continua funcionando
- [ ] Sidebar vazio quando nenhuma página selecionada

## Files Changed

- [ ] `apps/web/components/editor/PageEditor.tsx` (remover PageTags)
- [ ] `apps/web/components/layout/Sidebar.tsx` (adicionar PageInfo)
- [ ] `apps/web/components/layout/PageInfoPanel.tsx` (novo)

---

## QA Results

_To be filled after implementation_

## Dev Notes

_To be filled during implementation_
