# E5-S2: Fix BacklinksPanel N+1 Query

**Epic:** E5 - Performance Critical
**Priority:** P0
**Estimate:** 3 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que backlinks carreguem instantaneamente
**Para que** eu possa navegar entre páginas sem lag

## Context

Auditoria técnica revelou problema crítico em `BacklinksPanel.tsx`:

**Problema N+1:**
```typescript
// Linha 155-191 - Busca FULL CONTENT de cada backlink
const { data } = await supabase
  .from('page_links')
  .select(`
    source_id,
    pages!page_links_source_id_fkey (
      id,
      title,
      content  // ← FULL CONTENT! BlockNote JSON pode ter 100KB+
    )
  `)
  .eq('target_id', pageId);
```

**Impacto:**
- 50 backlinks = 50 × 100KB = 5MB+ de dados
- `extractContext()` faz tree traversal de cada content
- UI trava visivelmente

## Acceptance Criteria

- [ ] Query busca apenas campos necessários (id, title)
- [ ] Context extraído server-side via RPC ou View
- [ ] Tempo de load < 500ms para 50 backlinks
- [ ] UI não trava durante fetch
- [ ] Preview text limitado a 100 chars

## Technical Notes

### Solução 1: RPC Function (Recomendada)

```sql
-- supabase/migrations/xxx_get_backlinks_with_context.sql
CREATE OR REPLACE FUNCTION get_backlinks_with_context(p_page_id UUID)
RETURNS TABLE (
  source_id UUID,
  source_title TEXT,
  context_preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.source_id,
    p.title,
    LEFT(
      -- Extrair texto do primeiro bloco que contém o link
      COALESCE(
        (p.content::jsonb -> 0 -> 'content' -> 0 ->> 'text'),
        'Links to this page'
      ),
      100
    ) as context_preview
  FROM page_links pl
  JOIN pages p ON p.id = pl.source_id
  WHERE pl.target_id = p_page_id;
END;
$$ LANGUAGE plpgsql;
```

### Solução 2: Database View (Alternativa)

```sql
CREATE VIEW backlinks_with_context AS
SELECT
  pl.target_id,
  pl.source_id,
  p.title as source_title,
  LEFT((p.content::jsonb -> 0 -> 'content' -> 0 ->> 'text'), 100) as context
FROM page_links pl
JOIN pages p ON p.id = pl.source_id;
```

### Código Atualizado

```typescript
// BacklinksPanel.tsx
const fetchBacklinks = async () => {
  const { data, error } = await supabase
    .rpc('get_backlinks_with_context', { p_page_id: pageId });

  if (data) {
    setBacklinks(data.map(b => ({
      pageId: b.source_id,
      pageTitle: b.source_title,
      context: b.context_preview
    })));
  }
};
```

### Remover extractContext()

A função `extractContext()` (linhas 14-45) pode ser removida após migração.

## Migration Steps

1. [ ] Criar RPC function no Supabase
2. [ ] Testar RPC via SQL Editor
3. [ ] Atualizar BacklinksPanel.tsx
4. [ ] Remover extractContext function
5. [ ] Testar com página com muitos backlinks
6. [ ] Medir tempo de resposta

## Testing Checklist

- [ ] Backlinks aparecem corretamente
- [ ] Context preview mostra texto relevante
- [ ] Load time < 500ms
- [ ] Não há console errors
- [ ] UI responsiva durante load

## Files Changed

- [ ] `supabase/migrations/xxx_get_backlinks_with_context.sql` (NEW)
- [ ] `apps/web/components/editor/BacklinksPanel.tsx` (refactor)

---

## QA Results

_To be filled after implementation_
