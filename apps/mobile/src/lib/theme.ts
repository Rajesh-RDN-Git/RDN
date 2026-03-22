/**
 * RDN Mobile Theme — consumes shared design tokens for React Native
 *
 * Usage:
 *   import { theme } from '@/lib/theme';
 *   <View style={{ padding: theme.spacing.lg, backgroundColor: theme.colors.bgPrimary }}>
 */

import {
  palette,
  lightTheme,
  darkTheme,
  fontFamily,
  typeScale,
  spacing as spacingScale,
  spacingAlias,
  radius,
  elevation,
  zIndex,
  motion,
} from '../../../../packages/shared/src/design-tokens';

// Re-export tokens for direct access
export { palette, lightTheme, darkTheme, typeScale, zIndex, motion };

export const colors = {
  light: lightTheme,
  dark: darkTheme,
};

export const spacing = spacingAlias;

export const radii = radius;

export const shadows = {
  none: elevation[0].native,
  sm: elevation[1].native,
  md: elevation[2].native,
  lg: elevation[3].native,
  xl: elevation[4].native,
};

export const fonts = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
};

/**
 * Pre-built text styles for React Native StyleSheet.
 * Maps to the same type scale as web.
 */
export const textStyles = {
  'display-lg': { fontSize: 48, lineHeight: 56, fontWeight: '700' as const, letterSpacing: -0.96 },
  'display-md': { fontSize: 36, lineHeight: 44, fontWeight: '700' as const, letterSpacing: -0.72 },
  'display-sm': { fontSize: 30, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.3 },
  'heading-xl': { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.24 },
  'heading-lg': { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.2 },
  'heading-md': { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  'heading-sm': { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  'body-lg': { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  'body-md': { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  'body-sm': { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  'label-lg': { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  'label-md': { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  'label-sm': { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.12 },
  'caption-md': { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0.12 },
  'caption-sm': { fontSize: 11, lineHeight: 14, fontWeight: '400' as const, letterSpacing: 0.22 },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.66,
    textTransform: 'uppercase' as const,
  },
} as const;

/** Convenience: full theme object for useTheme()-style access */
export const theme = {
  colors: lightTheme,
  spacing: spacingAlias,
  radii: radius,
  shadows,
  fonts,
  textStyles,
  zIndex,
  motion,
} as const;
