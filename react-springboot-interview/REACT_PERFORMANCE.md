# React Performance — Problem → Solution

Code lives in `frontend/src/pages/VirtualizedLabPage.tsx`, `PaymentsPage.tsx`, `ConceptsLabPage.tsx`.

| Problem | Solution | Where |
|---------|----------|-------|
| Unnecessary child re-render | State placement; `React.memo` when props stable | `PaymentRow` |
| Expensive filter/sort in render | `useMemo` **after** measuring | Concepts lab |
| Child needs stable callback | `useCallback` **only if** memoized child | PaymentTable |
| 10,000 DOM rows | Virtualization (`@tanstack/react-virtual`) | `/labs/virtualized` |
| Large JS bundle | `React.lazy` + `Suspense` per route | `App.tsx` |
| Search fires every keystroke | Debounce 300ms | `useDebounce` + payments URL |
| Scroll/resize spam | Throttle | utils |
| Duplicate API fetches | TanStack Query cache/staleTime | `usePayments` |
| Slow backend | Pagination, filter server-side, BFF, timeouts | Spring list API |
| Stale request overwrites new | `AbortController` / Query cancel | Concepts + apiClient |
| Input lag while filtering | `useTransition` / `useDeferredValue` | Concepts lab |
| Auth everywhere re-renders | Narrow selectors; don't put server lists in Redux | authSlice only |

## Large table interview answer

```text
Without virtualization: 10,000 DOM nodes → jank
With virtualization: ~20–40 visible rows + spacers
Still need server pagination for 1M rows — virtualization ≠ fetch everything
```

## What NOT to say

- "Virtual DOM makes React always faster"
- "Always wrap in useMemo"
- "Redux will fix performance"
- "memo everywhere"

Profiler first. Measure. Then optimize.
