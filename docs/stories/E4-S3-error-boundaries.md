# E4-S3: Implementar Error Boundaries

**Epic:** E4 - Arquitetura & Refactoring
**Priority:** P1
**Estimate:** 4 hours
**Status:** [ ] Not Started

---

## Story

**Como** usuário do Lore
**Quero** que erros não quebrem toda a aplicação
**Para que** eu possa continuar usando outras partes do app

## Context

Atualmente se qualquer componente der erro, toda a página fica branca. Não há error boundaries nem error.tsx no Next.js App Router.

## Acceptance Criteria

- [ ] Error boundary global para app
- [ ] Error boundary para editor (não quebra sidebar)
- [ ] Error boundary para chat
- [ ] Error boundary para graph
- [ ] UI amigável para erros
- [ ] Botão "Try again" para retry
- [ ] Logging de erros para debugging

## Technical Notes

### Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <p className="text-red-400 mb-2">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-tech-olive hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Next.js error.tsx
```typescript
// app/(app)/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-xl text-warm-ivory mb-4">Something went wrong!</h2>
      <p className="text-warm-ivory/60 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-tech-olive text-void-black rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Uso nos componentes
```tsx
// PageEditor com boundary
<ErrorBoundary fallback={<EditorErrorFallback />}>
  <PageEditor pageId={pageId} />
</ErrorBoundary>

// Graph com boundary
<ErrorBoundary fallback={<GraphErrorFallback />}>
  <GraphViewModal />
</ErrorBoundary>
```

## Testing Checklist

- [ ] Erro no editor não quebra sidebar
- [ ] Erro no chat não quebra editor
- [ ] Try again funciona
- [ ] Logs aparecem no console
- [ ] error.tsx captura erros de server components

## Files Changed

- [ ] `apps/web/components/ErrorBoundary.tsx` (novo)
- [ ] `apps/web/app/(app)/error.tsx` (novo)
- [ ] `apps/web/app/(app)/page/[id]/error.tsx` (novo)
- [ ] `apps/web/components/layout/AppShell.tsx`
- [ ] `apps/web/components/editor/PageEditor.tsx`

---

## QA Results

_To be filled after implementation_
