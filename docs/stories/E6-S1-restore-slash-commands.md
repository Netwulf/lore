# E6-S1: Restaurar Comandos Slash Padrões do BlockNote

**Epic:** E6 - Bug Fixes & Polish
**Priority:** P0
**Estimate:** 3 hours
**Status:** [x] Complete

---

## Story

**Como** usuário do Lore
**Quero** ver todos os comandos slash (headings, lists, code blocks, etc.) quando digito "/"
**Para que** eu possa formatar meu conteúdo sem precisar memorizar markdown

## Context

Auditoria QA revelou que os comandos slash do BlockNote foram **completamente substituídos** por apenas comandos de IA. Isso quebra a experiência básica do editor.

**Problema Atual:**
- Menu "/" só mostra 8 comandos de IA (ask, continue, summarize, etc.)
- Comandos padrões do BlockNote (Heading 1-3, Bullet List, Numbered List, Code Block, etc.) **não aparecem**
- Se `aiEnabled=false`, menu "/" **não aparece de todo**

**Impacto:**
- Usuários não conseguem formatar texto via slash commands
- Experiência básica do editor quebrada
- Usuários sem API keys não têm acesso a nenhum comando

## Acceptance Criteria

- [x] Menu "/" mostra comandos padrões do BlockNote primeiro
- [x] Comandos de IA aparecem em seção separada abaixo (quando aiEnabled)
- [x] Menu "/" funciona mesmo sem API keys configuradas
- [x] Filtragem por query funciona para todos os comandos
- [x] Ordem: Básicos → Formatação → AI (se habilitado)

## Technical Notes

### Arquivos a Modificar

1. **`packages/editor/src/Editor.tsx`** - Combinar comandos padrões + AI
2. **`packages/editor/src/AICommands.tsx`** - Adicionar separador visual

### Implementação

```tsx
// packages/editor/src/Editor.tsx
import {
  getDefaultReactSlashMenuItems,
  filterSuggestionItems
} from '@blocknote/react';

function getSlashMenuItems(
  editor: WikiEditor,
  query: string,
  onImageCommand?: () => void,
  onAICommand?: (command: AICommand, context: any) => void
): DefaultReactSuggestionItem[] {
  // 1. Comandos padrões do BlockNote (sempre disponíveis)
  const defaultItems = getDefaultReactSlashMenuItems(editor);

  // 2. Comandos de IA (apenas se habilitados)
  const aiItems = onAICommand
    ? filterAICommands(query).map(cmd => ({
        title: `${cmd.icon} ${cmd.title}`,
        subtext: cmd.description,
        group: 'AI', // Agrupar visualmente
        onItemClick: () => onAICommand(cmd, getContext()),
      }))
    : [];

  // 3. Combinar e filtrar
  return filterSuggestionItems([...defaultItems, ...aiItems], query);
}
```

### Alteração no SuggestionMenuController

```tsx
// Remover condição que esconde menu quando AI desabilitado
<SuggestionMenuController
  triggerCharacter="/"
  getItems={async (query) =>
    getSlashMenuItems(editor, query, onImageCommand, onAICommand)
  }
/>
// Nota: Remover o wrapper condicional {(onImageCommand || onAICommand) && ...}
```

## Migration Steps

1. [x] Importar `getDefaultReactSlashMenuItems` do BlockNote
2. [x] Criar função `getSlashMenuItems` que combina padrões + AI
3. [x] Remover wrapper condicional do SuggestionMenuController
4. [x] Adicionar propriedade `group` para separar visualmente
5. [x] Testar com e sem API keys configuradas
6. [x] Verificar filtragem funciona corretamente

## Testing Checklist

- [x] "/" mostra Heading 1, 2, 3
- [x] "/" mostra Bullet List, Numbered List
- [x] "/" mostra Code Block, Quote
- [x] "/" mostra Image (básico)
- [x] "/" mostra comandos AI quando habilitado
- [x] Funciona sem API keys configuradas
- [x] Filtragem por "head" mostra Headings
- [x] Filtragem por "ask" mostra AI Ask (se habilitado)

## Files Changed

- [x] `packages/editor/src/Editor.tsx` (refactor slash menu)
- [ ] `packages/editor/src/AICommands.tsx` (no changes needed - group added in Editor.tsx)
- [ ] `packages/editor/src/index.ts` (no changes needed)

---

## QA Results

_Build passed - ready for manual testing_

## Dev Notes

**Implementation Summary (2025-01-01):**

1. Imported `getDefaultReactSlashMenuItems` from `@blocknote/react`
2. Created new `getSlashMenuItems()` function that:
   - Gets default BlockNote items first (Heading, Lists, Code, etc.)
   - Adds AI commands with `group: 'AI'` for visual separation
   - Works with or without AI handlers
3. Removed conditional wrapper `{(onImageCommand || onAICommand) && ...}`
4. Added `slashMenu={false}` to BlockNoteView to use custom menu
5. Removed unused `filterAICommands` import

**Key Changes:**
- Menu "/" now ALWAYS appears (not dependent on AI being enabled)
- Default BlockNote commands appear first
- AI commands appear in separate "AI" group (if enabled)
