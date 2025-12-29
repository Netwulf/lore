# E1-S6: Esconder AI Features até Configurar

**Epic:** E1 - Simplificação da UI
**Priority:** P1
**Estimate:** 3 hours
**Status:** [x] Completed

---

## Story

**Como** usuário do Lore
**Quero** que features de AI não apareçam até eu configurar API key
**Para que** a interface seja mais simples para quem não usa AI

## Acceptance Criteria

- [x] Botão "AI" no header só aparece se API key configurada
- [x] InlineAIToolbar só aparece se API key configurada
- [x] Tag suggestions só aparecem se API key configurada (removed from editor)
- [x] Image generation só aparece se API key configurada
- [ ] Semantic search degrada para text search silenciosamente (future enhancement)

## Technical Notes

### Hook para verificar configuração
```typescript
// hooks/useAIEnabled.ts
export function useAIEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const checkAPIKey = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_api_keys')
        .select('provider')
        .limit(1);
      setEnabled(data && data.length > 0);
    };
    checkAPIKey();
  }, []);

  return enabled;
}
```

### Uso nos componentes
```tsx
const aiEnabled = useAIEnabled();

// No AppShell
{aiEnabled && (
  <button onClick={() => setChatOpen(!chatOpen)}>AI</button>
)}
```

## Files Changed

- [ ] `apps/web/lib/hooks/useAIEnabled.ts` (novo)
- [ ] `apps/web/components/layout/AppShell.tsx`
- [ ] `apps/web/components/editor/PageEditor.tsx`
- [ ] `apps/web/components/layout/CommandPalette.tsx`

---

## QA Results

_To be filled after implementation_
