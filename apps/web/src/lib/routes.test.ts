import { isProtectedPath, loginRedirectFor } from './routes';

describe('isProtectedPath', () => {
  it('is true for dashboard routes', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/dashboard/users')).toBe(true);
  });

  it('is false for public routes', () => {
    expect(isProtectedPath('/')).toBe(false);
    expect(isProtectedPath('/property/abc-123')).toBe(false);
    expect(isProtectedPath('/search')).toBe(false);
    expect(isProtectedPath('/society/green-valley')).toBe(false);
  });
});

describe('loginRedirectFor', () => {
  it('returns null on public routes — a dead session must NOT eject a browsing user', () => {
    expect(loginRedirectFor('/property/abc-123')).toBeNull();
    expect(loginRedirectFor('/')).toBeNull();
    expect(loginRedirectFor('/search')).toBeNull();
  });

  it('redirects to login with a from param on protected routes', () => {
    expect(loginRedirectFor('/dashboard')).toBe('/login?from=%2Fdashboard');
    expect(loginRedirectFor('/dashboard/users')).toBe('/login?from=%2Fdashboard%2Fusers');
  });

  it('returns null when already on the login route', () => {
    expect(loginRedirectFor('/login')).toBeNull();
  });
});
