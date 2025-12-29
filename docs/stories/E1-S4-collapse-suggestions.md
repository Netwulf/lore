# E1-S4: Colapsar Related Suggestions por Default

**Epic:** E1 - Simplificação da UI
**Priority:** P1
**Estimate:** 2 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** que sugestões de conexões não apareçam automaticamente
**Para que** eu possa focar na escrita sem distrações

## Acceptance Criteria

- [x] RelatedSuggestionsPanel começa colapsado
- [x] Mostrar apenas header "Related (3)" com contador
- [x] Click no header expande/colapsa
- [x] Estado persistido em localStorage
- [x] Animação suave de expand/collapse

## Technical Notes

### Arquivo a modificar
`apps/web/components/editor/RelatedSuggestionsPanel.tsx`

### Implementação
```typescript
const [isExpanded, setIsExpanded] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('suggestions-expanded') === 'true';
  }
  return false; // Collapsed by default
});
```

## Files Changed

- [ ] `apps/web/components/editor/RelatedSuggestionsPanel.tsx`

---

## QA Results

_To be filled after implementation_
