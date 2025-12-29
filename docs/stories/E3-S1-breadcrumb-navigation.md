# E3-S1: Adicionar Breadcrumb Navigation

**Epic:** E3 - UX Polish & Navegação
**Priority:** P1
**Estimate:** 4 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** ver onde estou na hierarquia de páginas
**Para que** eu possa navegar facilmente para páginas pai

## Acceptance Criteria

- [ ] Breadcrumb aparece acima do título da página
- [ ] Mostra path completo: Home > Parent > Current
- [ ] Cada item é clicável e navega
- [ ] Truncar com "..." se muito longo
- [ ] Animação suave ao mudar de página

## Technical Notes

### Componente
```typescript
// components/editor/Breadcrumb.tsx
interface BreadcrumbProps {
  pageId: string;
  pages: Page[];
}

export function Breadcrumb({ pageId, pages }: BreadcrumbProps) {
  const path = useMemo(() => {
    const result: Page[] = [];
    let current = pages.find(p => p.id === pageId);

    while (current) {
      result.unshift(current);
      current = pages.find(p => p.id === current?.parent_id);
    }

    return result;
  }, [pageId, pages]);

  return (
    <nav className="flex items-center gap-1 text-sm text-warm-ivory/40 mb-2">
      <Link href="/" className="hover:text-warm-ivory">
        <HomeIcon className="w-4 h-4" />
      </Link>
      {path.map((page, i) => (
        <Fragment key={page.id}>
          <ChevronRight className="w-3 h-3" />
          {i === path.length - 1 ? (
            <span className="text-warm-ivory/60">{page.title}</span>
          ) : (
            <Link href={`/page/${page.id}`} className="hover:text-warm-ivory">
              {page.title}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

### Layout
```
┌────────────────────────────────────────┐
│ 🏠 > Projects > Lore > This Page       │  ← Breadcrumb
│                                        │
│ Page Title                             │
│ [tag1] [tag2]                          │
│                                        │
│ Content here...                        │
└────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Path correto para páginas nested
- [ ] Navegação funciona em todos os níveis
- [ ] Truncate funciona para paths longos
- [ ] Home icon leva para dashboard

## Files Changed

- [ ] `apps/web/components/editor/Breadcrumb.tsx` (novo)
- [ ] `apps/web/components/editor/PageEditor.tsx`

---

## QA Results

_To be filled after implementation_
