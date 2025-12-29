# Lore Refactoring PRD

**Version:** 1.0.0
**Created:** 2025-12-29
**Status:** Draft
**Author:** Quinn (QA Agent)

---

## Executive Summary

Refatorar o Lore para ser uma aplicação **minimalista, rápida e intuitiva** como Obsidian, Notion e Ulysses. O foco é remover complexidade desnecessária, melhorar performance e criar uma experiência de escrita sem distrações.

## Problem Statement

A aplicação atual sofre de:
1. **Feature Overload** - Muitas features visíveis ao mesmo tempo
2. **Performance Issues** - Graph view trava UI, re-renders excessivos
3. **UX Friction** - Não é óbvio como criar página, navegar, usar features
4. **Code Complexity** - Componentes monolíticos violando SRP

## Goals

| Goal | Metric | Target |
|------|--------|--------|
| First Contentful Paint | LCP | < 1.5s |
| Time to Interactive | TTI | < 2s |
| Create Page | Clicks | 1 click |
| Learning Curve | Onboarding | 0 (intuitivo) |
| Distraction Score | Visible elements | < 5 |

## Non-Goals

- Adicionar novas features
- Mudar stack tecnológico
- Redesign completo da identidade visual

---

## Epic Overview

| Epic | Title | Priority | Stories | Est. Hours |
|------|-------|----------|---------|------------|
| E1 | Simplificação da UI | P0 | 6 | 16-24h |
| E2 | Performance & Otimização | P0 | 5 | 20-30h |
| E3 | UX Polish & Navegação | P1 | 5 | 12-18h |
| E4 | Arquitetura & Refactoring | P1 | 4 | 24-32h |

**Total Estimado:** 72-104 horas (3-4 sprints)

---

## Epic 1: Simplificação da UI

**Objetivo:** Transformar o editor em uma experiência minimalista focada na escrita.

**Princípio:** "Esconder até precisar" - Features avançadas só aparecem quando solicitadas.

### Stories

| ID | Story | Priority | Est. |
|----|-------|----------|------|
| E1-S1 | Criar botão "+" para nova página | P0 | 2h |
| E1-S2 | Redirect automático para última página | P0 | 3h |
| E1-S3 | Mover Tags para Sidebar | P1 | 4h |
| E1-S4 | Colapsar Related Suggestions por default | P1 | 2h |
| E1-S5 | Mover Backlinks para Sidebar | P1 | 4h |
| E1-S6 | Esconder AI features até configurar | P1 | 3h |

---

## Epic 2: Performance & Otimização

**Objetivo:** Eliminar travamentos, reduzir bundle size, melhorar responsividade.

**Princípio:** "Lazy load everything" - Só carregar quando precisar.

### Stories

| ID | Story | Priority | Est. |
|----|-------|----------|------|
| E2-S1 | Lazy load GraphViewModal | P0 | 4h |
| E2-S2 | Lazy load ChatSidebar | P0 | 3h |
| E2-S3 | Graph layout em Web Worker | P0 | 8h |
| E2-S4 | Singleton Supabase client | P1 | 4h |
| E2-S5 | Otimizar CommandPalette debounce | P1 | 3h |

---

## Epic 3: UX Polish & Navegação

**Objetivo:** Tornar a navegação intuitiva e fornecer feedback visual adequado.

**Princípio:** "Mostre onde estou, guie para onde vou"

### Stories

| ID | Story | Priority | Est. |
|----|-------|----------|------|
| E3-S1 | Adicionar Breadcrumb navigation | P1 | 4h |
| E3-S2 | Keyboard shortcuts guide (⌘/) | P1 | 3h |
| E3-S3 | Empty states para sidebar vazia | P2 | 2h |
| E3-S4 | Loading skeletons | P2 | 3h |
| E3-S5 | Tooltip "Type [[ to link" | P2 | 2h |

---

## Epic 4: Arquitetura & Refactoring

**Objetivo:** Reduzir complexidade do código para facilitar manutenção.

**Princípio:** "Single Responsibility" - Cada componente faz uma coisa bem.

### Stories

| ID | Story | Priority | Est. |
|----|-------|----------|------|
| E4-S1 | Split PageEditor em componentes | P1 | 8h |
| E4-S2 | Extrair search logic do CommandPalette | P1 | 4h |
| E4-S3 | Implementar Error Boundaries | P1 | 4h |
| E4-S4 | Adicionar React Query para caching | P2 | 8h |

---

## Sprint Planning Suggestion

### Sprint 1 (Week 1) - Critical Path
- E1-S1: Botão nova página
- E1-S2: Redirect última página
- E2-S1: Lazy load Graph
- E2-S2: Lazy load Chat

### Sprint 2 (Week 2) - Simplification
- E1-S3: Tags para sidebar
- E1-S4: Colapsar suggestions
- E1-S5: Backlinks para sidebar
- E1-S6: Esconder AI

### Sprint 3 (Week 3) - Performance
- E2-S3: Web Worker graph
- E2-S4: Singleton Supabase
- E2-S5: Optimize CommandPalette

### Sprint 4 (Week 4) - Polish
- E3-S1: Breadcrumb
- E3-S2: Keyboard guide
- E4-S1: Split PageEditor
- E4-S3: Error boundaries

---

## Success Criteria

### Must Have (MVP)
- [ ] Criar página com 1 click
- [ ] Editor sem distrações visuais
- [ ] Graph view não trava UI
- [ ] Load time < 2s

### Should Have
- [ ] Breadcrumb navigation
- [ ] Keyboard shortcuts visíveis
- [ ] Error handling gracioso

### Nice to Have
- [ ] Dark/Light toggle
- [ ] Offline mode
- [ ] Export to Markdown

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Web Worker complexity | Alto | Usar biblioteca existente (comlink) |
| Breaking changes | Médio | Feature flags para rollback |
| Regression bugs | Médio | Testes antes de cada merge |

---

## Appendix: Current Architecture Issues

### PageEditor.tsx (282 lines)
```
Current: 1 componente monolítico
Target: 5+ componentes especializados
  - PageTitle.tsx
  - PageContent.tsx
  - PageMeta.tsx (tags + timestamps)
  - AISidebar.tsx
  - ConnectionsPanel.tsx
```

### GraphViewModal.tsx (509 lines)
```
Current: Layout calculation síncrono (300 iterações)
Target: Web Worker com postMessage
```

### CommandPalette.tsx (391 lines)
```
Current: Semantic search a cada 300ms
Target: Local-first, semantic após 1s ou Enter
```
