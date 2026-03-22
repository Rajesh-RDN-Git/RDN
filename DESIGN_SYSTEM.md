# RDN Design System

**Version:** 1.0
**Platforms:** Web (Next.js), iOS (React Native / Expo), Android (React Native / Expo)
**Personality:** Professional, trustworthy, data-dense, clean
**Audience:** RWA Admins, Resident Dealers, Property Owners, Buyers/Tenants, Super Admins

Token source of truth: `packages/shared/src/design-tokens/`

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Spacing, Radius, Shadows & Grid](#3-spacing-radius-shadows--grid)
4. [Core Components](#4-core-components)
5. [Consistency Rules](#5-consistency-rules)

---

## 1. Color System

### 1.1 Brand Palette

| Swatch   | Hex       | Usage                                          |
| -------- | --------- | ---------------------------------------------- |
| Blue 50  | `#EFF6FF` | Brand subtle bg (selected row, active sidebar) |
| Blue 100 | `#DBEAFE` | Brand hover bg, avatar fallback bg             |
| Blue 200 | `#BFDBFE` | Focus ring, light accent                       |
| Blue 500 | `#3B82F6` | Dark-mode primary, links on dark bg            |
| Blue 600 | `#2563EB` | **Primary brand** — buttons, active tab, links |
| Blue 700 | `#1D4ED8` | Primary hover state                            |
| Blue 800 | `#1E40AF` | Primary active/pressed state                   |
| Blue 900 | `#1E3A8A` | Brand text on light bg (rare)                  |

### 1.2 Neutral Palette

| Swatch   | Hex       | Light Mode Role                      | Dark Mode Role         |
| -------- | --------- | ------------------------------------ | ---------------------- |
| Gray 0   | `#FFFFFF` | Page bg, surface default             | Inverse text           |
| Gray 25  | `#FAFAFA` | — (reserved)                         | —                      |
| Gray 50  | `#F9FAFB` | Secondary bg (sidebar, table header) | Primary text           |
| Gray 100 | `#F3F4F6` | Tertiary bg (input fills)            | Skeleton shimmer       |
| Gray 200 | `#E5E7EB` | Border default, skeleton             | —                      |
| Gray 300 | `#D1D5DB` | Border strong, disabled text         | —                      |
| Gray 400 | `#9CA3AF` | Placeholder, tertiary text           | Secondary text (dark)  |
| Gray 500 | `#6B7280` | Muted icons                          | Tertiary text (dark)   |
| Gray 600 | `#4B5563` | Secondary text                       | Disabled text (dark)   |
| Gray 700 | `#374151` | Body text                            | Border default (dark)  |
| Gray 800 | `#1F2937` | Heading text                         | Tertiary bg (dark)     |
| Gray 900 | `#111827` | Primary text                         | Surface default (dark) |
| Gray 950 | `#030712` | —                                    | Page bg (dark)         |

### 1.3 Semantic Status Colors

| Status      | Background         | Border              | Text                | Icon                |
| ----------- | ------------------ | ------------------- | ------------------- | ------------------- |
| **Success** | Green 50 `#F0FDF4` | Green 200 `#BBF7D0` | Green 800 `#166534` | Green 600 `#16A34A` |
| **Warning** | Amber 50 `#FFFBEB` | Amber 200 `#FDE68A` | Amber 800 `#92400E` | Amber 600 `#D97706` |
| **Error**   | Red 50 `#FEF2F2`   | Red 200 `#FECACA`   | Red 800 `#991B1B`   | Red 600 `#DC2626`   |
| **Info**    | Blue 50 `#EFF6FF`  | Blue 200 `#BFDBFE`  | Blue 800 `#1E40AF`  | Blue 600 `#2563EB`  |

**Dark mode:** Backgrounds become deep-tinted (e.g., `#052E16` for success), borders shift to `*-700`, text shifts to `*-200`.

### 1.4 Semantic Token Map (Light / Dark)

```
Token               Light Value         Dark Value
────────────────────────────────────────────────────
bg-primary          #FFFFFF             #030712
bg-secondary        #F9FAFB             #111827
bg-tertiary         #F3F4F6             #1F2937
surface-default     #FFFFFF             #111827
surface-raised      #FFFFFF             #1F2937
text-primary        #111827             #F9FAFB
text-secondary      #4B5563             #9CA3AF
text-tertiary       #9CA3AF             #6B7280
text-disabled       #D1D5DB             #4B5563
brand-default       #2563EB             #3B82F6
brand-hover         #1D4ED8             #60A5FA
border-default      #E5E7EB             #374151
border-focus        #3B82F6             #3B82F6
overlay-backdrop    rgba(0,0,0,0.5)     rgba(0,0,0,0.7)
```

### 1.5 Dark Mode Rules

- **Never** use raw hex in components. Always reference semantic tokens.
- Dark mode inverts luminance, not hue. Blue stays blue, just brighter.
- Borders become lighter (`gray-700` in dark vs `gray-200` in light).
- Shadows become invisible on dark bg. Rely on border + surface color differentiation.
- Overlays increase opacity in dark mode (0.5 → 0.7).

---

## 2. Typography

### 2.1 Font Stack

| Role    | Family                                                       | Loading                                 |
| ------- | ------------------------------------------------------------ | --------------------------------------- |
| Primary | `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif` | `next/font/google` with `display: swap` |
| Mono    | `ui-monospace, SFMono-Regular, Menlo, monospace`             | System only                             |

### 2.2 Type Scale

| Token        | Size | Line Height | Weight | Letter Spacing |
| ------------ | ---- | ----------- | ------ | -------------- |
| `display-lg` | 48px | 56px        | 700    | -0.02em        |
| `display-md` | 36px | 44px        | 700    | -0.02em        |
| `display-sm` | 30px | 38px        | 700    | -0.01em        |
| `heading-xl` | 24px | 32px        | 700    | -0.01em        |
| `heading-lg` | 20px | 28px        | 600    | -0.01em        |
| `heading-md` | 18px | 26px        | 600    | 0              |
| `heading-sm` | 16px | 24px        | 600    | 0              |
| `body-lg`    | 16px | 24px        | 400    | 0              |
| `body-md`    | 14px | 20px        | 400    | 0              |
| `body-sm`    | 13px | 18px        | 400    | 0              |
| `label-lg`   | 16px | 24px        | 500    | 0              |
| `label-md`   | 14px | 20px        | 500    | 0              |
| `label-sm`   | 12px | 16px        | 500    | 0.01em         |
| `caption-md` | 12px | 16px        | 400    | 0.01em         |
| `caption-sm` | 11px | 14px        | 400    | 0.02em         |
| `overline`   | 11px | 16px        | 600    | 0.06em         |

### 2.3 Usage Map — Where Each Style Lives

```
LOCATION                     STYLE           EXAMPLE
──────────────────────────────────────────────────────────────────
Homepage hero title          display-lg      "Find Your Next Home"
Homepage subtitle            body-lg         "Browse verified listings..."
Marketing section title      display-sm      "How RDN Works"
Society page h1              heading-xl      "Green Valley Apartments"

Dashboard page title (h1)    heading-xl      "Properties"
Section header               heading-lg      "Active Listings"
Card title                   heading-md      "Lead Pipeline"
Card subtitle                heading-sm      "This Week"

Stat card value              display-sm      "247"
Stat card label              label-sm        "Total Properties"
Stat card trend              caption-md      "+12.5%"

Table column header          overline        "STATUS" (uppercase)
Table cell content           body-md         "Flat 203, Tower A"
Table action link            label-sm        "View Details"

Form label                   label-md        "Property Type"
Form input value             body-md         "3 BHK Apartment"
Form helper text             caption-md      "Select the flat configuration"
Form error message           caption-md      "This field is required"

Sidebar nav item             label-md        "Properties"
Tab label                    label-md        "Active" / "Pending"
Breadcrumb                   body-sm         "Dashboard / Properties / Edit"

Chat sender name             label-sm        "Rajesh Kumar"
Chat message body            body-md         "Is the flat available..."
Chat timestamp               caption-sm      "2:45 PM"

Property price               heading-lg      "85.00 L"
Property meta                body-md         "3 BHK · 900 sq.ft."
Property address             body-sm         "Flat 203, Tower A"

Badge text                   caption-md      "VERIFIED"
Tooltip text                 caption-md      "Click to expand"
Button (md)                  label-md        "Submit"
Modal title                  heading-lg      "Confirm Action"
```

### 2.4 Typography Rules

1. **Max 2 weights per surface.** A card should use at most bold + regular, or semibold + regular.
2. **Never use `font-bold` on body text.** Bold is reserved for headings, stat values, and prices.
3. **Line length limit:** body text must not exceed 75 characters wide (≈ `max-w-prose`).
4. **Responsive scaling:** display-lg drops to display-md on mobile; heading-xl drops to heading-lg.
5. **No custom font sizes.** If it's not in the scale, it doesn't ship.

---

## 3. Spacing, Radius, Shadows & Grid

### 3.1 Spacing Scale

Base unit: **4px**

| Token | Value | When to use                                    |
| ----- | ----- | ---------------------------------------------- |
| `0.5` | 2px   | Badge icon-to-text gap                         |
| `1`   | 4px   | Icon margins, tight inline gaps                |
| `1.5` | 6px   | Compact stacks (badge padding-y)               |
| `2`   | 8px   | Between related items, small gaps              |
| `2.5` | 10px  | Input padding-y                                |
| `3`   | 12px  | Input padding-x, list item gaps                |
| `4`   | 16px  | Between form fields, card gap, content padding |
| `5`   | 20px  | Between card sections                          |
| `6`   | 24px  | Card body padding, section padding             |
| `8`   | 32px  | Between major sections, page padding-y         |
| `10`  | 40px  | Dashboard section gap                          |
| `12`  | 48px  | Page top/bottom margins                        |
| `16`  | 64px  | Hero spacing                                   |

### 3.2 Spacing Rules

```
RULE                                    CORRECT           INCORRECT
──────────────────────────────────────────────────────────────────────
Card internal padding                   p-6 (24px)        p-4 or p-8
Gap between form fields                 space-y-4 (16px)  space-y-2 or space-y-6
Gap between stat cards                  gap-4 (16px)      gap-2 or gap-6
Page horizontal padding (mobile)        px-4 (16px)       px-2 or px-8
Page horizontal padding (desktop)       px-6 (24px)       px-4
Section vertical separation             mb-8 (32px)       mb-4 or mb-12
Modal body to actions                   mt-6 (24px)       mt-4
Table cell padding                      px-4 py-3         px-2 py-1
```

### 3.3 Border Radius

| Token  | Value  | Usage                                                |
| ------ | ------ | ---------------------------------------------------- |
| `none` | 0px    | Never (nothing should be sharp-cornered)             |
| `sm`   | 4px    | Inline chips, tooltip arrows                         |
| `md`   | 8px    | **Default** — buttons, inputs, cards, dropdowns      |
| `lg`   | 12px   | Modal, property cards, stat cards, elevated surfaces |
| `xl`   | 16px   | Bottom sheets (mobile), feature sections             |
| `full` | 9999px | Badges, avatars, toggle tracks, pill buttons         |

```
RULE                     CORRECT                 INCORRECT
───────────────────────────────────────────────────────────
Button                   rounded-lg (8px)        rounded-md, rounded-xl
Input                    rounded-lg (8px)        rounded-md
Card (dashboard)         rounded-lg (8px)        rounded-xl (reserved for elevated)
Card (property listing)  rounded-xl (12px)       rounded-lg
Modal                    rounded-xl (12px)       rounded-lg
Badge                    rounded-full            rounded-lg
Avatar                   rounded-full            rounded-lg
```

### 3.4 Elevation / Shadows

| Level | CSS Shadow Value                                                   | Usage                           |
| ----- | ------------------------------------------------------------------ | ------------------------------- |
| **0** | `none`                                                             | Flat elements, disabled state   |
| **1** | `0 1px 2px 0 rgba(0,0,0,0.05)`                                     | Resting cards, table containers |
| **2** | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`      | Card hover, dropdowns           |
| **3** | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`   | Popovers, FABs                  |
| **4** | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals, dialogs                 |

```
COMPONENT                RESTING   HOVER     ACTIVE
───────────────────────────────────────────────────
Card                     1         2         —
Property listing card    1         3         —
Dropdown menu            2         —         —
Modal                    4         —         —
Tooltip                  2         —         —
Button                   0         0         0 (buttons rely on bg color, not shadow)
```

### 3.5 Grid System

```
MAX WIDTH               1280px (max-w-7xl)
COLUMNS                 12
GUTTER                  24px (gap-6)
SIDEBAR                 256px (w-64) / 72px collapsed
HEADER                  64px (h-16)

BREAKPOINTS
  sm    640px    Mobile landscape
  md    768px    Tablet portrait
  lg    1024px   Tablet landscape / small desktop
  xl    1280px   Desktop
  2xl   1536px   Wide desktop

DASHBOARD STAT CARDS    grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4
PROPERTY GRID           grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3
FORM FIELDS             Single column (max-w-lg) or 2-col grid on xl
TABLE                   Full-width, overflow-x-auto on mobile
```

### 3.6 Z-Index Scale

| Token      | Value | Usage                    |
| ---------- | ----- | ------------------------ |
| `base`     | 0     | Normal flow              |
| `dropdown` | 10    | Select menus, popovers   |
| `sticky`   | 20    | Sticky table headers     |
| `header`   | 30    | App header, sidebar      |
| `overlay`  | 40    | Backdrop behind modal    |
| `modal`    | 50    | Modal dialog             |
| `toast`    | 60    | Toast notifications      |
| `tooltip`  | 70    | Tooltips (always on top) |

---

## 4. Core Components

### 4.1 Component Inventory

| Component  | Variants                                   | Sizes       |
| ---------- | ------------------------------------------ | ----------- |
| Button     | primary, secondary, outline, ghost, danger | sm, md, lg  |
| Input      | default, error                             | md (single) |
| Textarea   | default, error                             | md (single) |
| Select     | default, error                             | md (single) |
| PhoneInput | default, error                             | md (single) |
| OtpInput   | default, error                             | md (single) |
| Badge      | default, success, warning, error, info     | sm, md      |
| Avatar     | image, initials                            | sm, md, lg  |
| Card       | default, elevated                          | —           |
| StatCard   | default, with-trend, with-icon             | —           |
| DataTable  | default, loading, empty                    | —           |
| Modal      | default, destructive                       | sm, md, lg  |
| Tabs       | default                                    | —           |
| Pagination | default                                    | —           |
| Spinner    | —                                          | sm, md, lg  |
| Skeleton   | text, circle, rect                         | —           |
| EmptyState | default, with-action                       | —           |
| Toast      | success, error, warning, info              | —           |

### 4.2 State Matrix

Every interactive component must implement all applicable states:

```
              DEFAULT   HOVER     FOCUS     ACTIVE    DISABLED  ERROR     LOADING
─────────────────────────────────────────────────────────────────────────────────
Button        bg-600    bg-700    ring-2    bg-800    op-50     —         spinner
  secondary   bg-g100   bg-g200   ring-2    bg-g300   op-50     —         spinner
  outline     border    bg-g50    ring-2    bg-g100   op-50     —         spinner
  ghost       transp    bg-g50    ring-2    bg-g100   op-50     —         spinner
  danger      bg-r600   bg-r700   ring-2    bg-r800   op-50     —         spinner

Input         bdr-g300  bdr-g400  bdr-b500  —         bg-g100   bdr-r500  —
                                  +ring-1             +text-g400

Select        bdr-g300  bdr-g400  bdr-b500  —         bg-g100   bdr-r500  —
Textarea      bdr-g300  bdr-g400  bdr-b500  —         bg-g100   bdr-r500  —

Badge         bg-*100   —         —         —         op-50     —         —
Avatar        —         —         —         —         op-50     —         skeleton
Card          elev-1    elev-2    —         —         op-50     —         skeleton
Tab           text-g500 text-g700 —         bdr-b600  op-50     —         —
Pagination    text-g700 bg-g100   ring-2    bg-b600   op-50     —         —
Spinner       —         —         —         —         —         —         (is loading)
```

Legend: `bg-600` = brand bg 600, `bdr-g300` = border gray 300, `bdr-b500` = border blue 500, `bdr-r500` = border red 500, `op-50` = opacity 50%, `ring-2` = focus ring 2px brand color, `elev-*` = shadow level, `transp` = transparent

### 4.3 Component Specifications

#### Button

```
SIZE     HEIGHT    PADDING-X    FONT          MIN-WIDTH
sm       32px      12px         label-sm      64px
md       40px      16px         label-md      80px
lg       48px      24px         label-lg      96px

RADIUS: md (8px)
TRANSITION: colors 150ms ease-in-out

VARIANT COLORS (Light Mode):
  primary:    bg=blue-600  text=white      hover=blue-700   active=blue-800
  secondary:  bg=gray-100  text=gray-900   hover=gray-200   active=gray-300
  outline:    bg=white     text=gray-700   hover=gray-50    active=gray-100   border=gray-300
  ghost:      bg=transp    text=gray-700   hover=gray-100   active=gray-200
  danger:     bg=red-600   text=white      hover=red-700    active=red-800

DISABLED: opacity 50%, cursor not-allowed, no hover effects
LOADING:  content replaced with Spinner (inherits button text color), button disabled
FOCUS:    2px ring, brand color, offset 2px
```

#### Input

```
HEIGHT: 40px (py-2.5 + border)
PADDING: 12px horizontal, 10px vertical
RADIUS: md (8px)
BORDER: 1px solid gray-300
FONT: body-md (14px/20px, weight 400)
LABEL: label-md, gray-700, 4px margin-bottom
HELPER: caption-md, gray-500, 4px margin-top
ERROR TEXT: caption-md, red-600, 4px margin-top

STATES:
  default:  border gray-300
  hover:    border gray-400
  focus:    border blue-500 + 1px ring blue-500
  disabled: bg gray-100, text gray-400, cursor not-allowed
  error:    border red-500, error text visible
```

#### Card

```
PADDING: 24px (p-6)
RADIUS: md (8px) for dashboard cards, lg (12px) for property listing cards
BORDER: 1px solid gray-200
BACKGROUND: white (surface-default)
SHADOW: elevation-1 (resting)

STATES:
  default:    elevation-1, border gray-200
  hover:      elevation-2 (only on clickable cards like property listings)
  disabled:   opacity 50%
  loading:    skeleton placeholders (pulse animation)
```

#### Badge

```
PADDING: 6px horizontal, 2px vertical (px-2.5 py-0.5)
RADIUS: full (pill shape)
FONT: caption-md, weight 500
MIN-WIDTH: none (fits content)

VARIANTS (Light):
  default:  bg=gray-100  text=gray-800
  success:  bg=green-50  text=green-800
  warning:  bg=amber-50  text=amber-800
  error:    bg=red-50    text=red-800
  info:     bg=blue-50   text=blue-800
```

#### Modal

```
SIZES:
  sm:  max-width 400px    (confirmation dialogs)
  md:  max-width 512px    (standard forms, default)
  lg:  max-width 672px    (complex forms, tables)

RADIUS: lg (12px)
PADDING: 24px
SHADOW: elevation-4
BACKDROP: black/50 (light mode), black/70 (dark mode)
TITLE: heading-lg (20px, semibold)
CLOSE BUTTON: 24x24, gray-400 icon, hover bg gray-100, rounded-md

ENTER: fade-in backdrop 200ms, scale-up dialog from 95% 200ms ease-out
EXIT:  fade-out backdrop 150ms, scale-down dialog to 95% 150ms ease-in
```

#### DataTable

```
HEADER:
  bg: gray-50
  text: overline (11px, semibold, uppercase, 0.06em tracking)
  color: gray-500
  padding: px-4 py-3
  border-bottom: 1px gray-200

ROW:
  text: body-md
  padding: px-4 py-3
  border-bottom: 1px gray-200
  hover: bg gray-50

STATES:
  loading:  replaced with Spinner, centered
  empty:    EmptyState component, centered
  selected: bg blue-50, left border 2px blue-600

RESPONSIVE: overflow-x-auto wrapper, min-width on table
```

#### Tabs

```
BORDER: 1px bottom, gray-200
GAP: 32px between tabs (space-x-8)
FONT: label-md
INDICATOR: 2px bottom border

STATES:
  default:   text gray-500, border transparent
  hover:     text gray-700, border gray-300
  active:    text blue-600, border blue-600
  disabled:  text gray-300, cursor not-allowed
```

#### Toast (new component)

```
POSITION: top-right, 16px from edges
WIDTH: 360px max
RADIUS: lg (12px)
SHADOW: elevation-3
PADDING: 16px
AUTO-DISMISS: 5 seconds (success/info), manual dismiss (error/warning)

VARIANTS: same color scheme as Badge (bg-*, text-*, icon color)
ENTER: slide-in from right, 300ms ease-out
EXIT: fade-out + slide-right, 200ms ease-in
```

### 4.4 Mobile-Specific Adaptations

```
COMPONENT        WEB                           MOBILE (REACT NATIVE)
─────────────────────────────────────────────────────────────────────
Button           hover:bg-*-700                activeOpacity: 0.7
Input            focus:ring-1                  borderColor on focus
Card             hover:shadow-lg               — (no hover)
Modal            createPortal + fixed           React Native Modal
Tabs             border-b tabs                 Segmented control or top tabs
Pagination       Previous 1 2 3 Next           Infinite scroll
DataTable        <table>                       FlatList with card rows
Toast            position fixed                react-native-toast-message
```

---

## 5. Consistency Rules

### 5.1 Color Rules

| Rule                                                       | Correct                                  | Incorrect                                   |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Use semantic tokens, not raw palette                       | `text-primary` / `textPrimary`           | `text-gray-900` / `#111827`                 |
| Status colors use the 4-slot pattern (bg/border/text/icon) | Badge: `bg-green-50 text-green-800`      | Badge: `bg-green-500 text-white`            |
| Never mix status colors                                    | Success badge = green bg + green text    | Green bg + red text                         |
| Brand color is blue-600 (light) or blue-500 (dark)         | Primary button: `bg-blue-600`            | Primary button: `bg-blue-500` in light mode |
| Backgrounds alternate: primary → secondary → tertiary      | Page=white, sidebar=gray-50, input=white | Page=gray-50, sidebar=white                 |

### 5.2 Typography Rules

| Rule                                           | Correct                                                        | Incorrect                          |
| ---------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| One h1 per page (page title)                   | Single `heading-xl` at top                                     | Two `heading-xl` on same page      |
| Headings use the hierarchy: xl → lg → md → sm  | Card inside section: section=`heading-lg`, card=`heading-md`   | Both use `heading-lg`              |
| Table headers always use `overline`            | `text-xs uppercase font-semibold tracking-wider text-gray-500` | `text-sm font-bold text-gray-900`  |
| Prices always use `heading-lg` or `display-sm` | Price: `text-xl font-semibold` (heading-lg)                    | Price: `text-sm font-bold`         |
| Never underline text except links              | Link: `underline text-blue-600`                                | Heading: `underline text-gray-900` |
| Placeholder text is gray-400                   | `placeholder:text-gray-400`                                    | `placeholder:text-gray-600`        |

### 5.3 Spacing Rules

| Rule                                     | Correct                  | Incorrect                  |
| ---------------------------------------- | ------------------------ | -------------------------- |
| Card padding is always 24px              | `p-6`                    | `p-4` or `p-8`             |
| Form field gap is always 16px            | `space-y-4`              | `space-y-3` or `space-y-6` |
| Page title to content is 24px            | `mb-6`                   | `mb-4` or `mb-8`           |
| Section to section is 32px               | `mb-8`                   | `mb-6` or `mb-12`          |
| Button groups use 12px gap               | `gap-3`                  | `gap-2` or `gap-4`         |
| Modal actions align right                | `flex justify-end gap-3` | `flex justify-between`     |
| Never use margin on the component itself | Parent sets `gap-4`      | Button has `mb-4`          |

### 5.4 Component Usage Rules

| Rule                                                 | Correct                                                 | Incorrect                                    |
| ---------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| Primary button: 1 per visible area                   | One "Save" button                                       | Two primary buttons side-by-side             |
| Destructive actions use `danger` variant             | Delete: `<Button variant="danger">`                     | Delete: `<Button variant="primary">`         |
| Confirm dialogs: secondary left, primary right       | `[Cancel] [Confirm]`                                    | `[Confirm] [Cancel]`                         |
| Tables always include loading + empty states         | `isLoading` → Spinner, `data.length === 0` → EmptyState | Blank white space when loading               |
| Forms show error below field, not in toast           | Error below input: `<p class="text-red-600">`           | Toast: "Name is required"                    |
| Use Badge for status, not colored text               | `<Badge variant="success">Active</Badge>`               | `<span class="text-green-600">Active</span>` |
| Modals always have title + close button              | `<Modal title="Edit Property" onClose={...}>`           | Modal with no title or no close              |
| Avatar fallback shows initials, never a generic icon | `RK` (Rajesh Kumar)                                     | Generic person icon                          |
| Empty states include a CTA when possible             | "No properties yet" + [Add Property] button             | "No properties yet" (dead end)               |
| Loading spinners are centered in their container     | `flex justify-center py-12`                             | Spinner at top-left corner                   |

### 5.5 Responsive Rules

| Rule                                                       | Correct                                     | Incorrect                        |
| ---------------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| Mobile-first: start with 1 column, expand                  | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | `grid-cols-3` with no responsive |
| Touch targets minimum 44x44px on mobile                    | Button height ≥ 44px, tap areas ≥ 44px      | 32px buttons on mobile           |
| Sidebar collapses to icon-only on tablet, hidden on mobile | 256px → 72px → off-canvas                   | Fixed 256px always               |
| Tables become card-stacks on mobile (< 768px)              | `<div class="md:hidden">` card view         | Tiny horizontal-scroll table     |
| Text truncates with ellipsis, never wraps to 4+ lines      | `truncate` or `line-clamp-2`                | 6-line property descriptions     |

### 5.6 Accessibility Rules

| Rule                                                  | Implementation                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Focus must be visible                                 | `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`                            |
| Color is never the only indicator                     | Badge: color bg + text label, Trend: color + `+`/`-` prefix                                               |
| Contrast ratio ≥ 4.5:1 for text                       | gray-600 on white = 5.7:1 (pass). gray-400 on white = 3.0:1 (fail — tertiary text only for non-essential) |
| Interactive elements have `cursor-pointer`            | All buttons, links, clickable cards                                                                       | Missing cursor on card links |
| Disabled elements: `aria-disabled`, no pointer events | `disabled aria-disabled="true"`                                                                           | Only visual opacity change   |
| Modal traps focus                                     | Focus cycles within modal, returns to trigger on close                                                    | Focus escapes behind modal   |
| Images have meaningful alt text                       | `alt="3 BHK Apartment, Flat 203"`                                                                         | `alt="image"` or no alt      |
| Spinners have `role="status"` + sr-only label         | `<div role="status"><span class="sr-only">Loading...</span></div>`                                        | No ARIA                      |

### 5.7 Anti-Patterns (Never Do This)

```
ANTI-PATTERN                              WHY                              DO THIS INSTEAD
──────────────────────────────────────────────────────────────────────────────────────────────
Inline styles                             Unthemeable, unmaintainable      Tailwind classes or tokens
Hardcoded hex in components               Breaks dark mode                 Semantic token references
Multiple font families                    Inconsistent look                Always use Inter
Shadow + border on same element           Visual clutter                   Pick one: shadow OR border
Colored text without background context   Low contrast risk                Use Badge for status
Custom scrollbar styling                  Platform inconsistency           Use native scrollbars
Nesting more than 3 card levels           Visual hierarchy collapse        Flatten with spacing
px-based font sizes in mobile             Ignores accessibility scaling    Use sp (Android) / Dynamic Type (iOS)
```

---

## Appendix: File Reference

| File                                              | Purpose                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| `packages/shared/src/design-tokens/colors.ts`     | Palette + semantic light/dark tokens              |
| `packages/shared/src/design-tokens/typography.ts` | Type scale, font families, usage map              |
| `packages/shared/src/design-tokens/spacing.ts`    | Spacing, radius, elevation, grid, z-index, motion |
| `packages/shared/src/design-tokens/index.ts`      | Barrel export                                     |
| `apps/web/tailwind.config.ts`                     | Consumes tokens → Tailwind theme                  |
| `apps/web/src/app/globals.css`                    | CSS custom properties from tokens                 |
| `apps/web/src/components/ui/`                     | 17 web UI components                              |
| `apps/mobile/src/components/ui/`                  | 3 mobile UI components (needs parity)             |
