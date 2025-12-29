# E3-S3: Empty States para Sidebar

**Epic:** E3 - UX Polish & Navegação
**Priority:** P2
**Estimate:** 2 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário novo do Lore
**Quero** ver instruções claras quando não tenho páginas
**Para que** eu saiba como começar

## Acceptance Criteria

- [ ] Quando não há páginas, mostrar empty state amigável
- [ ] Botão de ação "Create your first page"
- [ ] Quando não há tags, mostrar dica
- [ ] Design consistente com o resto do app

## Technical Notes

### Empty State para Pages
```tsx
// components/layout/PageTree.tsx
if (rootPages.length === 0) {
  return (
    <div className="p-4 text-center">
      <DocumentIcon className="w-8 h-8 mx-auto mb-2 text-warm-ivory/20" />
      <p className="text-sm text-warm-ivory/40 mb-3">
        No pages yet
      </p>
      <button
        onClick={handleCreatePage}
        className="text-sm text-tech-olive hover:underline"
      >
        Create your first page
      </button>
    </div>
  );
}
```

### Empty State para Tags
```tsx
// components/layout/TagsSidebar.tsx
if (tags.length === 0) {
  return (
    <div className="p-2 text-center">
      <p className="text-xs text-warm-ivory/30">
        Tags will appear here
      </p>
    </div>
  );
}
```

## Testing Checklist

- [ ] Empty state aparece sem páginas
- [ ] Botão cria página
- [ ] Empty state some após criar página

## Files Changed

- [ ] `apps/web/components/layout/PageTree.tsx`
- [ ] `apps/web/components/layout/TagsSidebar.tsx`

---

## QA Results

_To be filled after implementation_
