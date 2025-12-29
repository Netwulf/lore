# E2-S4: Singleton Supabase Client

**Epic:** E2 - Performance & Otimização
**Priority:** P1
**Estimate:** 4 hours
**Status:** [ ] Not Started

---

## Story

**Como** desenvolvedor do Lore
**Quero** que exista apenas uma instância do Supabase client
**Para que** não haja conexões duplicadas e requests redundantes

## Context

Atualmente cada hook chama `createClient()` criando novas instâncias:
- usePages → createClient()
- useTags → createClient()
- useLinks → createClient()
- PageEditor → createClient()

Isso causa:
- Múltiplas conexões WebSocket
- Sem cache compartilhado
- Memory leak potencial

## Acceptance Criteria

- [ ] Única instância de Supabase client
- [ ] Client acessível via hook ou context
- [ ] Funciona com SSR (server vs client)
- [ ] Realtime subscriptions funcionam
- [ ] Auth state compartilhado

## Technical Notes

### Implementação com singleton
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
}

// Para testes - reset do singleton
export function resetClient() {
  supabaseInstance = null;
}
```

### Alternativa com Context (opcional)
```typescript
// contexts/SupabaseContext.tsx
const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }) {
  const [supabase] = useState(() => createClient());
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) throw new Error('useSupabase must be within SupabaseProvider');
  return context;
}
```

## Testing Checklist

- [ ] Login/logout funciona
- [ ] Realtime updates funcionam
- [ ] Múltiplos hooks usam mesmo client
- [ ] SSR não quebra
- [ ] Memory não aumenta com navegação

## Files Changed

- [ ] `apps/web/lib/supabase/client.ts`
- [ ] `apps/web/lib/hooks/usePages.ts`
- [ ] `apps/web/lib/hooks/useTags.ts`
- [ ] `apps/web/lib/hooks/useLinks.ts`
- [ ] Todos arquivos que chamam createClient()

---

## QA Results

_To be filled after implementation_
