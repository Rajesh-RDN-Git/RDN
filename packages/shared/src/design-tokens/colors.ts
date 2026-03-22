/**
 * RDN Design System — Color Tokens
 *
 * Single source of truth for every color across Web, iOS, and Android.
 * Consumed by:
 *   - Web:    Tailwind CSS config + CSS custom properties
 *   - Mobile: React Native StyleSheet / theme provider
 *
 * Naming: semantic aliases reference the palette by role, not by hue.
 * This lets us swap palettes (e.g. white-label) without touching components.
 */

// ─────────────────────────────────────────────
// 1. PALETTE  — raw color swatches, never used directly in components
// ─────────────────────────────────────────────

export const palette = {
  // Brand Blue
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Neutral Gray (Inter-optimized)
  gray: {
    0: '#FFFFFF',
    25: '#FAFAFA',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic accents
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
  },

  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
  },

  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
  },

  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
  },
} as const;

// ─────────────────────────────────────────────
// 2. SEMANTIC TOKENS — Light Mode
// ─────────────────────────────────────────────

export const lightTheme = {
  // Backgrounds
  bgPrimary: palette.gray[0], // page background
  bgSecondary: palette.gray[50], // section / sidebar background
  bgTertiary: palette.gray[100], // input / card subtle fill
  bgInverse: palette.gray[900], // inverted panels, tooltips

  // Surfaces (cards, modals, dropdowns)
  surfaceDefault: palette.gray[0],
  surfaceRaised: palette.gray[0],
  surfaceOverlay: palette.gray[0],

  // Text
  textPrimary: palette.gray[900],
  textSecondary: palette.gray[600],
  textTertiary: palette.gray[400],
  textInverse: palette.gray[0],
  textPlaceholder: palette.gray[400],
  textDisabled: palette.gray[300],

  // Brand / Interactive
  brandDefault: palette.blue[600],
  brandHover: palette.blue[700],
  brandActive: palette.blue[800],
  brandSubtle: palette.blue[50],
  brandSubtleHover: palette.blue[100],
  brandText: palette.blue[700],

  // Border
  borderDefault: palette.gray[200],
  borderStrong: palette.gray[300],
  borderFocus: palette.blue[500],
  borderError: palette.red[500],

  // Status — Success
  successBg: palette.green[50],
  successBorder: palette.green[200],
  successText: palette.green[800],
  successIcon: palette.green[600],

  // Status — Warning
  warningBg: palette.amber[50],
  warningBorder: palette.amber[200],
  warningText: palette.amber[800],
  warningIcon: palette.amber[600],

  // Status — Error / Destructive
  errorBg: palette.red[50],
  errorBorder: palette.red[200],
  errorText: palette.red[800],
  errorIcon: palette.red[600],

  // Status — Info
  infoBg: palette.blue[50],
  infoBorder: palette.blue[200],
  infoText: palette.blue[800],
  infoIcon: palette.blue[600],

  // Overlays
  overlayBackdrop: 'rgba(0, 0, 0, 0.5)',
  overlayScrim: 'rgba(0, 0, 0, 0.2)',

  // Skeleton / Loading
  skeletonBase: palette.gray[200],
  skeletonShimmer: palette.gray[100],
} as const;

// ─────────────────────────────────────────────
// 3. SEMANTIC TOKENS — Dark Mode
// ─────────────────────────────────────────────

export const darkTheme: Record<keyof typeof lightTheme, string> = {
  // Backgrounds
  bgPrimary: palette.gray[950],
  bgSecondary: palette.gray[900],
  bgTertiary: palette.gray[800],
  bgInverse: palette.gray[50],

  // Surfaces
  surfaceDefault: palette.gray[900],
  surfaceRaised: palette.gray[800],
  surfaceOverlay: palette.gray[800],

  // Text
  textPrimary: palette.gray[50],
  textSecondary: palette.gray[400],
  textTertiary: palette.gray[500],
  textInverse: palette.gray[900],
  textPlaceholder: palette.gray[500],
  textDisabled: palette.gray[600],

  // Brand / Interactive
  brandDefault: palette.blue[500],
  brandHover: palette.blue[400],
  brandActive: palette.blue[300],
  brandSubtle: '#1E293B', // blue-tinted dark bg
  brandSubtleHover: '#1E3A5F',
  brandText: palette.blue[400],

  // Border
  borderDefault: palette.gray[700],
  borderStrong: palette.gray[600],
  borderFocus: palette.blue[500],
  borderError: palette.red[500],

  // Status — Success
  successBg: '#052E16',
  successBorder: palette.green[700],
  successText: palette.green[200],
  successIcon: palette.green[500],

  // Status — Warning
  warningBg: '#451A03',
  warningBorder: palette.amber[700],
  warningText: palette.amber[200],
  warningIcon: palette.amber[500],

  // Status — Error
  errorBg: '#450A0A',
  errorBorder: palette.red[700],
  errorText: palette.red[200],
  errorIcon: palette.red[500],

  // Status — Info
  infoBg: '#172554',
  infoBorder: palette.blue[700],
  infoText: palette.blue[200],
  infoIcon: palette.blue[500],

  // Overlays
  overlayBackdrop: 'rgba(0, 0, 0, 0.7)',
  overlayScrim: 'rgba(0, 0, 0, 0.4)',

  // Skeleton / Loading
  skeletonBase: palette.gray[700],
  skeletonShimmer: palette.gray[600],
} as const;

// ─────────────────────────────────────────────
// 4. TYPE EXPORTS
// ─────────────────────────────────────────────

export type SemanticTheme = typeof lightTheme;
export type PaletteScale = typeof palette;
export type ThemeMode = 'light' | 'dark' | 'system';
