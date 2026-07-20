// Route-gating shared between middleware intent and the API client's dead-session handling.
// Mirrors middleware's `protectedRoutes = ['/dashboard']`.
const PROTECTED_PREFIXES = ['/dashboard'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// When a session is found to be dead (refresh rejected), decide where to send the user.
// On a protected route → login (preserving where they were). On any public route → null,
// meaning: stay put and render as a guest. A dead session must never eject someone who is
// only browsing public pages.
export function loginRedirectFor(pathname: string): string | null {
  if (pathname.startsWith('/login')) return null;
  if (!isProtectedPath(pathname)) return null;
  return `/login?from=${encodeURIComponent(pathname)}`;
}
