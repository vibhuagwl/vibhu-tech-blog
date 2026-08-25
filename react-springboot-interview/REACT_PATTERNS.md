# React Design Patterns (practical)

Prefer composition + hooks. Mark legacy clearly.

## Custom Hooks

**Problem:** duplicate fetch/debounce/permission logic.  
**Code:** `hooks/usePayments.ts`, `useDebounce.ts`.  
**Use:** reusable stateful logic.  
**Not:** when it's just a shared pure function.  
**Q:** Hook vs component? Hook returns data/callbacks; component returns UI.

## Provider Pattern

**Problem:** theme/auth deep in tree.  
**Code:** `ThemeContext`, Redux `Provider`.  
**Use:** infrequent updates / session.  
**Not:** high-churn server lists (use Query).

## Controlled Components

**Problem:** form values as source of truth in React.  
**Code:** Create payment form / RHF.  
**Use:** validation, disable submit, derived UI.  
**Not:** tiny unmanaged file inputs sometimes use uncontrolled + ref.

## Container / Presentational

**Problem:** separate data wiring from markup.  
**Modern take:** page/hooks = container; memo row = presentational.  
**Less dogma** than 2016 blogs.

## Compound Components

**Problem:** flexible `<Tabs><TabList/><TabPanels/>`.  
**Use:** design systems.  
**Not:** one-off payment row.

## State Reducer

**Problem:** parent needs to control complex state transitions.  
**Code:** `useReducer` payment fetch machine.  
**Use:** many related actions (`FETCH_*`, `RETRY_*`).

## Render Props / HOC

**Legacy-ish.** Prefer hooks. Know for interviews: HOC wraps component; render prop passes function as child. Hooks replaced most cases.

## Composition

```tsx
<Layout>
  <PaymentsPage />
</Layout>
```

Children + slots beat deep inheritance.
