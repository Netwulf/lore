# E4-S1: Split PageEditor em Componentes

**Epic:** E4 - Arquitetura & Refactoring
**Priority:** P1
**Estimate:** 8 hours
**Status:** [ ] Not Started

---

## Story

**Como** desenvolvedor do Lore
**Quero** que o PageEditor seja dividido em componentes menores
**Para que** o código seja mais fácil de manter e debugar

## Context

O PageEditor.tsx atual tem 282 linhas e gerencia:
- Título da página
- Conteúdo (BlockNote)
- Tags
- Backlinks
- Related suggestions
- AI toolbar
- Image generation modal
- Save status
- Text selection

Isso viola o princípio de Single Responsibility.

## Acceptance Criteria

- [ ] PageEditor reduzido para < 100 linhas
- [ ] Cada sub-componente em arquivo próprio
- [ ] Props tipadas corretamente
- [ ] Sem mudança de comportamento (refactor only)
- [ ] Testes passam (quando existirem)

## Technical Notes

### Nova estrutura
```
components/editor/
├── PageEditor.tsx        (~80 lines - container)
├── PageTitle.tsx         (~40 lines - título editável)
├── PageContent.tsx       (~60 lines - wrapper do BlockNote)
├── PageMeta.tsx          (~50 lines - timestamps, info)
├── SaveIndicator.tsx     (~30 lines - status de save)
├── AIToolbarContainer.tsx (~50 lines - inline AI)
└── hooks/
    ├── usePageSave.ts    (~60 lines - lógica de save)
    └── usePageContent.ts (~40 lines - content state)
```

### PageEditor refatorado
```typescript
// PageEditor.tsx (~80 lines)
export function PageEditor({ pageId, initialContent, initialTitle }) {
  const { title, setTitle, content, setContent, saveStatus } =
    usePageSave(pageId, initialContent, initialTitle);

  const { selection, hasSelection, clearSelection } =
    useTextSelection({ containerRef: editorRef });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <SaveIndicator status={saveStatus} />
      <PageTitle value={title} onChange={setTitle} />
      <PageContent
        ref={editorRef}
        content={content}
        onChange={setContent}
      />
      {hasSelection && (
        <AIToolbarContainer
          selection={selection}
          onApply={handleApply}
          onCancel={clearSelection}
        />
      )}
    </div>
  );
}
```

### usePageSave hook
```typescript
// hooks/usePageSave.ts
export function usePageSave(pageId, initialContent, initialTitle) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const debouncedSave = useDebouncedCallback(async () => {
    setSaveStatus('saving');
    // save logic...
    setSaveStatus('saved');
  }, 1000);

  useEffect(() => {
    debouncedSave();
  }, [title, content]);

  return { title, setTitle, content, setContent, saveStatus };
}
```

## Migration Steps

1. [ ] Criar hooks primeiro (usePageSave, usePageContent)
2. [ ] Criar componentes menores (PageTitle, SaveIndicator)
3. [ ] Refatorar PageEditor para usar novos componentes
4. [ ] Testar tudo funciona igual
5. [ ] Remover código duplicado

## Testing Checklist

- [ ] Salvar título funciona
- [ ] Salvar conteúdo funciona
- [ ] WikiLinks funcionam
- [ ] AI toolbar funciona
- [ ] Image insertion funciona
- [ ] Save status indica corretamente

## Files Changed

- [ ] `apps/web/components/editor/PageEditor.tsx` (refactor)
- [ ] `apps/web/components/editor/PageTitle.tsx` (novo)
- [ ] `apps/web/components/editor/PageContent.tsx` (novo)
- [ ] `apps/web/components/editor/SaveIndicator.tsx` (novo)
- [ ] `apps/web/components/editor/AIToolbarContainer.tsx` (novo)
- [ ] `apps/web/lib/hooks/usePageSave.ts` (novo)

---

## QA Results

_To be filled after implementation_
