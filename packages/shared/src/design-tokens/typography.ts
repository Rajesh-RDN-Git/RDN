/**
 * RDN Design System — Typography Tokens
 *
 * Font: Inter (Google Fonts)
 * Scale: based on a 1.250 ratio (Major Third) anchored at 16px body
 *
 * Every text style in the product maps to exactly one entry below.
 * Components must use these tokens — never raw Tailwind text-* classes.
 */

// ─────────────────────────────────────────────
// 1. FONT FAMILIES
// ─────────────────────────────────────────────

export const fontFamily = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
} as const;

// ─────────────────────────────────────────────
// 2. TYPE SCALE
//    Each entry: [fontSize, lineHeight, letterSpacing, fontWeight]
//    fontSize in px → consumers convert to rem (web) or pt (native)
// ─────────────────────────────────────────────

export const typeScale = {
  // Display — hero sections, marketing pages
  'display-lg': { fontSize: 48, lineHeight: 56, letterSpacing: -0.02, fontWeight: 700 },
  'display-md': { fontSize: 36, lineHeight: 44, letterSpacing: -0.02, fontWeight: 700 },
  'display-sm': { fontSize: 30, lineHeight: 38, letterSpacing: -0.01, fontWeight: 700 },

  // Heading — page titles, section headers, card titles
  'heading-xl': { fontSize: 24, lineHeight: 32, letterSpacing: -0.01, fontWeight: 700 },
  'heading-lg': { fontSize: 20, lineHeight: 28, letterSpacing: -0.01, fontWeight: 600 },
  'heading-md': { fontSize: 18, lineHeight: 26, letterSpacing: 0, fontWeight: 600 },
  'heading-sm': { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 600 },

  // Body — paragraphs, descriptions, form values
  'body-lg': { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 400 },
  'body-md': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: 400 },
  'body-sm': { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontWeight: 400 },

  // Label — form labels, buttons, nav items, table headers
  'label-lg': { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 500 },
  'label-md': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: 500 },
  'label-sm': { fontSize: 12, lineHeight: 16, letterSpacing: 0.01, fontWeight: 500 },

  // Caption — metadata, timestamps, helper text, badges
  'caption-md': { fontSize: 12, lineHeight: 16, letterSpacing: 0.01, fontWeight: 400 },
  'caption-sm': { fontSize: 11, lineHeight: 14, letterSpacing: 0.02, fontWeight: 400 },

  // Overline — table column headers, section labels
  overline: { fontSize: 11, lineHeight: 16, letterSpacing: 0.06, fontWeight: 600 },
} as const;

// ─────────────────────────────────────────────
// 3. USAGE MAP — where each style lives
// ─────────────────────────────────────────────

export const typographyUsage = {
  // Public pages
  heroTitle: 'display-lg', // Homepage hero, marketing headlines
  heroSubtitle: 'body-lg', // Below hero title
  sectionTitle: 'display-sm', // Section headers on public pages
  societyName: 'heading-xl', // Society profile page h1

  // Dashboard
  pageTitle: 'heading-xl', // Dashboard page titles (h1)
  sectionHeader: 'heading-lg', // Card group headers, table titles
  cardTitle: 'heading-md', // Individual card headings
  statValue: 'display-sm', // StatCard large number
  statLabel: 'label-sm', // StatCard label below number
  statTrend: 'caption-md', // +12% trend indicator

  // Tables
  tableHeader: 'overline', // Column headers (uppercase)
  tableCell: 'body-md', // Cell content
  tableAction: 'label-sm', // Action links in rows

  // Forms
  formLabel: 'label-md', // Input labels
  formValue: 'body-md', // Input values
  formHelper: 'caption-md', // Helper text below inputs
  formError: 'caption-md', // Error messages

  // Navigation
  navItem: 'label-md', // Sidebar links, header nav
  navItemActive: 'label-md', // Active state (weight doesn't change)
  tabLabel: 'label-md', // Tab bar labels
  breadcrumb: 'body-sm', // Breadcrumb trail

  // Chat / Communication
  messageSender: 'label-sm', // Sender name in chat
  messageBody: 'body-md', // Message content
  messageTime: 'caption-sm', // Timestamp below message

  // Property listings
  propertyPrice: 'heading-lg', // Price on property card
  propertyMeta: 'body-md', // 3 BHK | 900 sq.ft.
  propertyAddress: 'body-sm', // Address line

  // Badges & pills
  badgeText: 'caption-md', // Badge labels
  tooltipText: 'caption-md', // Tooltip content

  // Buttons
  buttonLg: 'label-lg',
  buttonMd: 'label-md',
  buttonSm: 'label-sm',

  // Modal
  modalTitle: 'heading-lg',
  modalBody: 'body-md',
} as const;

// ─────────────────────────────────────────────
// 4. TYPE EXPORTS
// ─────────────────────────────────────────────

export type TypeScaleKey = keyof typeof typeScale;
export type TypeUsageKey = keyof typeof typographyUsage;
