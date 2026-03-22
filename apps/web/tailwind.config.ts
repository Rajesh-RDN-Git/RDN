import type { Config } from 'tailwindcss';
import { palette, elevation, layout } from '../../packages/shared/src/design-tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette
        primary: palette.blue,

        // Semantic colors via CSS custom properties (set in globals.css)
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          active: 'var(--color-brand-active)',
          subtle: 'var(--color-brand-subtle)',
          text: 'var(--color-brand-text)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
        },
        success: {
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
          text: 'var(--color-success-text)',
          icon: 'var(--color-success-icon)',
        },
        warning: {
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
          text: 'var(--color-warning-text)',
          icon: 'var(--color-warning-icon)',
        },
        error: {
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
          text: 'var(--color-error-text)',
          icon: 'var(--color-error-icon)',
        },
        info: {
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
          text: 'var(--color-info-text)',
          icon: 'var(--color-info-icon)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-lg': [
          '3rem',
          { lineHeight: '3.5rem', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'display-md': [
          '2.25rem',
          { lineHeight: '2.75rem', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'display-sm': [
          '1.875rem',
          { lineHeight: '2.375rem', letterSpacing: '-0.01em', fontWeight: '700' },
        ],
        'heading-xl': [
          '1.5rem',
          { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '700' },
        ],
        'heading-lg': [
          '1.25rem',
          { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        'heading-md': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        'heading-sm': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        'label-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption-md': [
          '0.75rem',
          { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '400' },
        ],
        'caption-sm': [
          '0.6875rem',
          { lineHeight: '0.875rem', letterSpacing: '0.02em', fontWeight: '400' },
        ],
        overline: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'elevation-0': elevation[0].web,
        'elevation-1': elevation[1].web,
        'elevation-2': elevation[2].web,
        'elevation-3': elevation[3].web,
        'elevation-4': elevation[4].web,
      },
      maxWidth: {
        content: `${layout.maxWidth}px`,
      },
      width: {
        sidebar: `${layout.sidebarWidth}px`,
        'sidebar-collapsed': `${layout.sidebarCollapsed}px`,
      },
      height: {
        header: `${layout.headerHeight}px`,
      },
      zIndex: {
        dropdown: '10',
        sticky: '20',
        header: '30',
        sidebar: '30',
        overlay: '40',
        modal: '50',
        toast: '60',
        tooltip: '70',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
    },
  },
  plugins: [],
};

export default config;
