# E2-S2: Lazy Load ChatSidebar

**Epic:** E2 - Performance & Otimização
**Priority:** P0
**Estimate:** 3 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que o Chat Sidebar só carregue quando eu abrir
**Para que** o app carregue mais rápido para quem não usa AI

## Acceptance Criteria

- [ ] ChatSidebar usa dynamic import
- [ ] Loading indicator enquanto carrega
- [ ] Componente só renderiza quando isOpen=true
- [ ] Sem re-mount ao abrir/fechar (preservar histórico)

## Technical Notes

### Implementação
```typescript
// AppShell.tsx
const ChatSidebar = dynamic(
  () => import('@/components/chat/ChatSidebar'),
  {
    loading: () => <ChatSidebarSkeleton />,
    ssr: false,
  }
);

// Render apenas quando aberto
{chatOpen && <ChatSidebar onClose={() => setChatOpen(false)} />}
```

### Preservar estado
Usar key ou manter mounted para preservar histórico de chat.

## Testing Checklist

- [ ] Chat abre corretamente
- [ ] Histórico preservado ao fechar/abrir
- [ ] Loading state visível
- [ ] Streaming funciona

## Files Changed

- [ ] `apps/web/components/layout/AppShell.tsx`

---

## QA Results

_To be filled after implementation_
