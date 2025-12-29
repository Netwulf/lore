# E4-S4: Adicionar React Query para Caching

**Epic:** E4 - Arquitetura & Refactoring
**Priority:** P2
**Estimate:** 8 hours
**Status:** [ ] Not Started

---

## Story

**Como** desenvolvedor do Lore
**Quero** usar React Query para gerenciar requests
**Para que** tenhamos caching, deduplication e refetching automático

## Context

Atualmente cada hook faz fetch independente:
- usePages busca páginas
- useTags busca tags
- Cada instância faz request separado
- Sem cache compartilhado
- Sem invalidation strategy

## Acceptance Criteria

- [ ] React Query Provider configurado
- [ ] usePages migrado para useQuery
- [ ] useTags migrado para useQuery
- [ ] Cache invalidation em mutations
- [ ] Optimistic updates para melhor UX
- [ ] Stale-while-revalidate para dados frescos

## Technical Notes

### Setup Provider
```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### usePages com React Query
```typescript
// hooks/usePages.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePages() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      return data || [];
    },
  });

  const createPageMutation = useMutation({
    mutationFn: async (parentId?: string) => {
      // create logic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      // update logic
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pages'] });
      const previous = queryClient.getQueryData(['pages']);
      queryClient.setQueryData(['pages'], (old) =>
        old.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['pages'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  return {
    pages,
    isLoading,
    createPage: createPageMutation.mutate,
    updatePage: updatePageMutation.mutate,
  };
}
```

### Dependencies
```bash
npm install @tanstack/react-query
```

## Migration Steps

1. [ ] Instalar @tanstack/react-query
2. [ ] Criar QueryClientProvider
3. [ ] Migrar usePages
4. [ ] Migrar useTags
5. [ ] Migrar useLinks
6. [ ] Adicionar DevTools (dev only)
7. [ ] Testar cache invalidation

## Testing Checklist

- [ ] Páginas carregam corretamente
- [ ] Create page atualiza lista
- [ ] Delete page atualiza lista
- [ ] Update é optimistic
- [ ] Refresh não perde dados

## Files Changed

- [ ] `package.json` (add dependency)
- [ ] `apps/web/app/providers.tsx` (novo)
- [ ] `apps/web/app/layout.tsx` (wrap with provider)
- [ ] `apps/web/lib/hooks/usePages.ts` (rewrite)
- [ ] `apps/web/lib/hooks/useTags.ts` (rewrite)
- [ ] `apps/web/lib/hooks/useLinks.ts` (rewrite)

---

## QA Results

_To be filled after implementation_
