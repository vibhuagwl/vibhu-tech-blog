/**
 * Auth lives in Redux (`store/authSlice` + `hooks/useAuth`).
 * Theme uses Context (`ThemeContext`) — intentional split for interview talking points:
 *   - Redux: cross-cutting auth that many trees need + DevTools time-travel
 *   - Context: low-frequency theme toggle without polluting the store
 *
 * If you prefer Context for auth in an interview answer, wrap `useAuth` here.
 */
export {}
