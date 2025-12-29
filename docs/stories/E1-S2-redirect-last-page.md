# E1-S2: Redirect Automático para Última Página

**Epic:** E1 - Simplificação da UI
**Priority:** P0
**Estimate:** 3 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** ser redirecionado para minha última página editada ao fazer login
**Para que** eu possa continuar de onde parei sem navegação manual

## Context

Atualmente ao logar, o usuário vê uma página "Welcome to Lore" genérica que não serve propósito prático. Isso adiciona um clique desnecessário.

Obsidian abre o último arquivo. Notion mostra a última página visitada.

## Acceptance Criteria

- [x] Ao logar, redireciona para última página editada (updated_at mais recente)
- [x] Se não houver páginas, cria uma "Getting Started" automaticamente
- [x] Se tiver páginas mas nenhuma recente, vai para primeira página
- [ ] Armazena last_visited em localStorage como backup (future enhancement)
- [x] Funciona no refresh da página também

## Technical Notes

### Arquivo a modificar
`apps/web/app/(app)/page.tsx`

### Query para última página
```typescript
const { data: lastPage } = await supabase
  .from('pages')
  .select('id')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();

if (lastPage) {
  redirect(`/page/${lastPage.id}`);
}
```

### Fallback: Getting Started
```typescript
if (!lastPage) {
  const { data: newPage } = await supabase
    .from('pages')
    .insert({
      title: 'Getting Started',
      content: defaultContent,
      user_id: user.id
    })
    .select()
    .single();
  redirect(`/page/${newPage.id}`);
}
```

## Edge Cases

1. **Usuário novo:** Criar página "Getting Started" com conteúdo tutorial
2. **Página deletada:** Se last_visited foi deletada, ir para mais recente
3. **Offline:** Usar localStorage como fallback

## Testing Checklist

- [ ] Login redireciona para última página
- [ ] Refresh mantém na mesma página
- [ ] Usuário novo recebe "Getting Started"
- [ ] Deletar última página funciona corretamente

## Files Changed

- [ ] `apps/web/app/(app)/page.tsx`
- [ ] `apps/web/lib/hooks/usePages.ts` (adicionar getLastPage)

---

## QA Results

_To be filled after implementation_

## Dev Notes

_To be filled during implementation_
