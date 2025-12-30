# Lore Refactoring Stories

**Version:** 1.0.0
**Created:** 2025-12-29
**Total Stories:** 20
**Estimated Hours:** 72-104h

---

## Overview

Este diretório contém as stories de refatoração do Lore para transformá-lo em uma aplicação minimalista como Obsidian/Notion/Ulysses.

## Epic Summary

| Epic | Title | Stories | Priority | Est. Hours |
|------|-------|---------|----------|------------|
| E1 | Simplificação da UI | 6 | P0 | 16-24h |
| E2 | Performance & Otimização | 5 | P0 | 20-30h |
| E3 | UX Polish & Navegação | 5 | P1 | 12-18h |
| E4 | Arquitetura & Refactoring | 4 | P1 | 24-32h |

---

## Stories Index

### Epic 1: Simplificação da UI (P0)

| ID | Story | Est. | Status |
|----|-------|------|--------|
| [E1-S1](./E1-S1-new-page-button.md) | Criar botão "+" para nova página | 2h | [x] |
| [E1-S2](./E1-S2-redirect-last-page.md) | Redirect automático para última página | 3h | [x] |
| [E1-S3](./E1-S3-tags-to-sidebar.md) | Mover Tags para Sidebar | 4h | [x] |
| [E1-S4](./E1-S4-collapse-suggestions.md) | Colapsar Related Suggestions | 2h | [x] |
| [E1-S5](./E1-S5-backlinks-to-sidebar.md) | Mover Backlinks para Sidebar | 4h | [x] |
| [E1-S6](./E1-S6-hide-ai-features.md) | Esconder AI features até configurar | 3h | [x] |

### Epic 2: Performance & Otimização (P0)

| ID | Story | Est. | Status |
|----|-------|------|--------|
| [E2-S1](./E2-S1-lazy-load-graph.md) | Lazy load GraphViewModal | 4h | [x] |
| [E2-S2](./E2-S2-lazy-load-chat.md) | Lazy load ChatSidebar | 3h | [x] |
| [E2-S3](./E2-S3-graph-web-worker.md) | Graph layout em Web Worker | 8h | [x] |
| [E2-S4](./E2-S4-singleton-supabase.md) | Singleton Supabase client | 4h | [x] |
| [E2-S5](./E2-S5-optimize-command-palette.md) | Otimizar CommandPalette debounce | 3h | [x] |

### Epic 3: UX Polish & Navegação (P1)

| ID | Story | Est. | Status |
|----|-------|------|--------|
| [E3-S1](./E3-S1-breadcrumb-navigation.md) | Adicionar Breadcrumb navigation | 4h | [x] |
| [E3-S2](./E3-S2-keyboard-shortcuts-guide.md) | Keyboard shortcuts guide | 3h | [x] |
| [E3-S3](./E3-S3-empty-states.md) | Empty states para sidebar | 2h | [ ] |
| [E3-S4](./E3-S4-loading-skeletons.md) | Loading skeletons | 3h | [ ] |
| [E3-S5](./E3-S5-wikilink-tooltip.md) | Tooltip "Type [[ to link" | 2h | [ ] |

### Epic 4: Arquitetura & Refactoring (P1)

| ID | Story | Est. | Status |
|----|-------|------|--------|
| [E4-S1](./E4-S1-split-page-editor.md) | Split PageEditor em componentes | 8h | [x] |
| [E4-S2](./E4-S2-extract-search-hook.md) | Extrair search logic do CommandPalette | 4h | [ ] |
| [E4-S3](./E4-S3-error-boundaries.md) | Implementar Error Boundaries | 4h | [x] |
| [E4-S4](./E4-S4-react-query.md) | Adicionar React Query para caching | 8h | [ ] |

---

## Sprint Planning (Suggestion)

### Sprint 1 (Week 1) - Critical Path ✅ COMPLETED
- [x] E1-S1: Botão nova página
- [x] E1-S2: Redirect última página
- [x] E2-S1: Lazy load Graph
- [x] E2-S2: Lazy load Chat

### Sprint 2 (Week 2) - Simplification ✅ COMPLETED
- [x] E1-S3: Tags para sidebar
- [x] E1-S4: Colapsar suggestions
- [x] E1-S5: Backlinks para sidebar
- [x] E1-S6: Esconder AI

### Sprint 3 (Week 3) - Performance ✅ COMPLETED
- [x] E2-S3: Web Worker graph
- [x] E2-S4: Singleton Supabase
- [x] E2-S5: Optimize CommandPalette

### Sprint 4 (Week 4) - Polish ✅ COMPLETED
- [x] E3-S1: Breadcrumb
- [x] E3-S2: Keyboard guide
- [x] E4-S1: Split PageEditor
- [x] E4-S3: Error boundaries

---

## How to Use

1. Pick a story from the index
2. Read the full story file
3. Update status to `[x]` when starting
4. Follow acceptance criteria
5. Update QA Results section when done
6. Move to next story

## Story Template

Each story follows this structure:
- **Story**: User story format (As a... I want... So that...)
- **Context**: Background and why this matters
- **Acceptance Criteria**: Checkboxes for completion
- **Technical Notes**: Implementation guidance
- **Testing Checklist**: How to verify
- **Files Changed**: Which files to modify
- **QA Results**: Filled after implementation

---

**PRD Reference:** [lore-refactor-prd.md](../prd/lore-refactor-prd.md)
