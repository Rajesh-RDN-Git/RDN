/**
 * RDN Design System — Spacing, Radius, Shadows, Grid & Layout Tokens
 *
 * Base unit: 4px
 * Scale: geometric with semantic aliases for common use cases.
 */

// ─────────────────────────────────────────────
// 1. SPACING SCALE (in px)
//    Tailwind mapping: space-{key} where key = px/4
// ─────────────────────────────────────────────

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Named spacing aliases — use these in component code */
export const spacingAlias = {
  /** 2px — tight inline gaps (badge icon + text) */
  xxs: spacing[0.5],
  /** 4px — micro spacing (icon margin, tight stacks) */
  xs: spacing[1],
  /** 8px — compact gaps (between related items, badge padding) */
  sm: spacing[2],
  /** 12px — default inner padding (input padding, list item gap) */
  md: spacing[3],
  /** 16px — standard content gap (between cards, form fields) */
  lg: spacing[4],
  /** 24px — section padding (card body, sidebar padding) */
  xl: spacing[6],
  /** 32px — major gaps (between sections) */
  '2xl': spacing[8],
  /** 48px — page-level vertical rhythm (section margins) */
  '3xl': spacing[12],
  /** 64px — hero-level spacing */
  '4xl': spacing[16],
} as const;

// ─────────────────────────────────────────────
// 2. BORDER RADIUS
// ─────────────────────────────────────────────

export const radius = {
  /** 0px — no rounding */
  none: 0,
  /** 4px — subtle rounding (chips, inline elements) */
  sm: 4,
  /** 8px — standard rounding (inputs, buttons, cards) */
  md: 8,
  /** 12px — prominent rounding (modals, elevated cards, property cards) */
  lg: 12,
  /** 16px — large rounding (bottom sheets, feature sections) */
  xl: 16,
  /** 9999px — pill shape (badges, avatars, toggles) */
  full: 9999,
} as const;

// ─────────────────────────────────────────────
// 3. ELEVATION / SHADOWS
//    Named levels 0-4, each platform interprets differently
// ─────────────────────────────────────────────

export const elevation = {
  /** Flat — no shadow (inline elements, disabled states) */
  0: {
    web: 'none',
    native: { shadowOpacity: 0, elevation: 0 },
  },
  /** Subtle — resting cards, table containers */
  1: {
    web: '0 1px 2px 0 rgba(0,0,0,0.05)',
    native: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  /** Default — interactive cards hover, dropdowns */
  2: {
    web: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    native: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  },
  /** Raised — popovers, floating action buttons, card hover */
  3: {
    web: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    native: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
  },
  /** Overlay — modals, dialogs, mobile bottom sheets */
  4: {
    web: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    native: {
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 15,
      elevation: 8,
    },
  },
} as const;

// ─────────────────────────────────────────────
// 4. GRID & LAYOUT
// ─────────────────────────────────────────────

export const layout = {
  /** Page max-width for main content (1280px = Tailwind max-w-7xl) */
  maxWidth: 1280,

  /** Sidebar width */
  sidebarWidth: 256, // w-64
  sidebarCollapsed: 72, // w-18 (icon-only)

  /** Header height */
  headerHeight: 64, // h-16

  /** Content columns (CSS Grid) */
  columns: 12,

  /** Gutter between columns */
  gutter: 24, // gap-6

  /** Page horizontal padding */
  pagePaddingX: 16, // px-4 (mobile), px-6 (tablet+)

  /** Page vertical padding */
  pagePaddingY: 32, // py-8

  /** Card grid — dashboard stat cards */
  statGridCols: { sm: 1, md: 2, lg: 4 },

  /** Card grid — property listing grid */
  listingGridCols: { sm: 1, md: 2, lg: 3 },
} as const;

export const breakpoints = {
  /** Mobile-first breakpoints (min-width) */
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ─────────────────────────────────────────────
// 5. Z-INDEX SCALE
// ─────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  header: 30,
  sidebar: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

// ─────────────────────────────────────────────
// 6. ANIMATION / MOTION
// ─────────────────────────────────────────────

export const motion = {
  duration: {
    instant: 100, // toggling states
    fast: 150, // hover, focus
    normal: 200, // expand/collapse, tab switch
    slow: 300, // modal enter, page transition
    slower: 500, // skeleton shimmer, progress bars
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out (Tailwind default)
    enter: 'cubic-bezier(0, 0, 0.2, 1)', // ease-out (entering)
    exit: 'cubic-bezier(0.4, 0, 1, 1)', // ease-in  (leaving)
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce   (playful)
  },
} as const;
