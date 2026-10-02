---
name: Quiet Control
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bbcac6'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#859490'
  outline-variant: '#3c4947'
  surface-tint: '#4fdbc8'
  primary: '#4fdbc8'
  on-primary: '#003731'
  primary-container: '#14b8a6'
  on-primary-container: '#00423b'
  inverse-primary: '#006b5f'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff7b88'
  on-tertiary-container: '#7a0022'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#71f8e4'
  primary-fixed-dim: '#4fdbc8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: '300'
    lineHeight: 3.25rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: 2.25rem
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  metric-hero:
    fontFamily: JetBrains Mono
    fontSize: 2.25rem
    fontWeight: '300'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  metric-card:
    fontFamily: JetBrains Mono
    fontSize: 1.5rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-default:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: -0.005em
  body-muted:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  code-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0em
  metadata-label:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
  badge-label:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an industrial energy-intelligence control environment tailored for Indian MSME manufacturing facilities. Operating at the intersection of factory-floor physical infrastructure (high-pressure compressed air manifolds, heavy kW induction motors) and executive financial oversight, the design language embodies **Quiet Luxury Control Room**. 

It prioritizes severe visual restraint, high-density telemetry legibility, and architectural precision. The UI evokes absolute operational confidence, situational awareness, and poise—eschewing consumer SaaS gloss, gamified accents, or saturated neon glows. The interface operates as an engineered precision gauge: black graphite backdrops, whisper-thin hairlines, and muted steel palettes where luminescence is reserved strictly for operational status, phase deviations, and monetized kilowatt leaks.

## Colors

The palette is engineered strictly for low eye-strain under 24/7 control-room monitoring and ambient plant floor light levels.

- **Foundational Canvas**: Deep graphite `#0B0E12` anchors the viewport, minimizing display energy and providing an infinite baseline.
- **Card & Tiered Surfaces**: Level 1 structural cards occupy `#11161C`, while floating headers, toolbars, and nested telemetry blocks occupy `#161D24`. Border structural separation relies entirely on subtle hairlines (`rgba(255, 255, 255, 0.07)`), completely eliminating heavy visual noise.
- **Primary Telemetry Accent**: Refined emerald-teal (`#14B8A6` base, `#2DD4BF` interactive/glow highlight). Applied sparingly to indicate active line pressure, steady-state compressor stages, live heartbeats, and kilowatt-hour cost reductions.
- **Semantics & Diagnostics**:
  - *Warning / Maintenance*: Industrial Amber (`#F59E0B` / `#D97706`) for pressure band deviations, air-filter clogging, and motor phase unbalance.
  - *Critical / Leaks*: Muted Coral-Red (`#F43F5E` / `#E11D48`) reserved exclusively for unseated valves, acute system pressure drops, and critical motor overload trips.
  - *Steel Slates*: `#64748B` (secondary telemetry / disabled), `#94A3B8` (labels, inactive states), and `#E2E8F0` (primary readout typography).
- **Rule of Exclusion**: No decorative gradients, no purples, and no soft colored drop-shadows. Color functions strictly as semantic status.

## Typography

The typographic hierarchy separates structural operational context from dense quantitative telemetry:

1. **System & Structural Hierarchy**: Built on **Geist**. Displays and section headers maintain light to regular weights (`300` to `400`), providing an airy, calm control-room posture that prevents visual weight fatigue.
2. **Metadata & Labels**: Rendered in uppercase, boldened (`600`), tracking-widest (`0.08em`) slate (`#94A3B8` / `#64748B`) at small scale (`0.6875rem`). This replicates CNC/HMI industrial instrumentation consoles.
3. **Data Telemetry & Financial Metrics**: Built on **JetBrains Mono** with forced tabular figures (`tabular-nums`) across all bar pressure readings (CFM, Bar, PSI), electrical loads (kW, kVA, Power Factor), and rupee valuations (₹/hr). Hero data points scale large (`2.25rem`) with ultra-light stroke weights (`300`) to highlight values without shouting.

## Layout & Spacing

The layout is grounded in a continuous 8px engineering base rhythm:

- **Global Shell**: A slim 64px fixed left navigation spine coupled with a 56px utility top bar. The remaining canvas functions as an edge-to-edge dashboard utilizing a fluid 12-column responsive grid system.
- **Outer Canvas Margins**: Uniform 24px (`1.5rem`) on desktop environments, condensing to 16px (`1rem`) on portable tablet field units.
- **Card Spacing & Internal Density**: Internal telemetry padding is strictly `1rem` (`space-md`) to maximize viewport data volume without visual overlap. Nested sub-modules (e.g., motor stage breakdown rows) use `0.5rem` (`space-sm`) gaps.
- **Breakpoints & Adaptations**:
  - **Desktop (>=1280px)**: 12-column grid. Multi-compressor telemetry boards render 3 to 4 metrics wide with synchronous live sparklines.
  - **Tablet (768px - 1279px)**: 6-column reflow. Secondary motor metrics fold under main pressure indicators.
  - **Mobile (<768px)**: 1-column stack. Sparklines condense into compact range bars with current tabular output.

## Elevation & Depth

This system intentionally eliminates traditional diffuse drop shadows, skeuomorphic bevels, and frosted glass blurs. Depth is achieved via **tonal step-layers and architectural borders**:

- **Ground (Level 0)**: `#0B0E12` canvas background.
- **Containers (Level 1)**: `#11161C` card surfaces framed by a razor-sharp `1px` solid border (`rgba(255, 255, 255, 0.07)`).
- **Interactive & Raised Units (Level 2)**: `#161D24` surfaces applied to modal panels, dropdown flyouts, and active motor channel overlays. Border opacity increments to `rgba(255, 255, 255, 0.12)`.
- **Active Focus & Hover**: Never elevated through vertical Y-axis shift. Active cards introduce a hairline left accent border (`2px solid #14B8A6`) or an inner structural highlight (`inset 0 0 0 1px rgba(45, 212, 191, 0.25)`).

## Shapes

The design system standardizes on controlled, functional geometry:

- **Cards & Data Modules**: Base radius of `8px` (`rounded-md` to `rounded-lg`). Crisp enough to read as serious precision equipment, soft enough to avoid harsh brutalist edges.
- **Controls & Input Fields**: `6px` radius. Provides an intentional tactile contour for dropdowns, date pickers, and threshold adjusters.
- **Status Pills & Live Dots**: Full pill shape (`9999px`) reserved purely for system state indicators, machine statuses (e.g., `RUNNING`, `OFF-LOAD`), and profile badges.

## Components

### Buttons & Action Bars
- **Primary Action**: `#14B8A6` background, `#0B0E12` text (high-contrast deep graphite for peak readability), font weight 500, 6px border radius. Hover transitions to `#2DD4BF`. No glow or drop-shadows.
- **Secondary / Utility**: Transparent surface with `#161D24` fill, 1px border `rgba(255, 255, 255, 0.1)`, `#E2E8F0` text. Hover adds `rgba(255, 255, 255, 0.05)` fill.
- **Critical / Interruption**: `#161D24` surface with `1px solid rgba(244, 63, 94, 0.4)` border and `#F43F5E` text.

### Metric Tiles & Telemetry Sparklines
- Enclosed in `#11161C` surfaces.
- Contains an uppercase metadata label (`text-[11px] font-semibold tracking-wider text-slate-400 uppercase`), followed by a hero tabular metric (`JetBrains Mono`, light weight).
- Integrated SVG micro-sparklines: hairline 1.5px paths in `#14B8A6` (or `#F43F5E` during line pressure drop) with a subtle vertical gradient fading to transparent at zero axis.

### Industrial Status Badges
- Pill layout (`rounded-full`), padding `2px 8px`, `font-mono text-[11px] font-medium`.
- **Running / Optimized**: Background `rgba(20, 184, 166, 0.1)`, text `#2DD4BF`, border `1px solid rgba(20, 184, 166, 0.2)`.
- **Idle / Unloaded**: Background `rgba(148, 163, 184, 0.1)`, text `#94A3B8`, border `1px solid rgba(148, 163, 184, 0.2)`.
- **Pressure Drop Warning**: Background `rgba(245, 158, 11, 0.1)`, text `#F59E0B`, border `1px solid rgba(245, 158, 11, 0.2)`.
- **Critical Air Leak**: Background `rgba(244, 63, 94, 0.1)`, text `#F43F5E`, border `1px solid rgba(244, 63, 94, 0.2)`.

### Top Bar & Facility Navigation
- Fixed 56px height, background `#0B0E12`, border-bottom `1px solid rgba(255, 255, 255, 0.07)`.
- Left zone: Facility selector dropdown (Plant Unit, Line Alpha) flanked by a live heartbeat indicator: 6px circular dot `#14B8A6` with an automated 2-second ambient pulse ring.
- Right zone: Live UTC / IST synchronized digital time stamp (`JetBrains Mono`), factory power factor aggregate, and user profile pill.

### High-Density Data Tables
- Row height: 40px for compact dense scanning.
- Headers: `#0B0E12` or `#161D24`, bottom-bordered with `1px solid rgba(255, 255, 255, 0.1)`. Typography: `text-[11px] font-semibold text-slate-400 uppercase tracking-wider`.
- Cells: Tabular numbers right-aligned, status pills centered, machine identifier left-aligned with a mono tag (e.g., `CMP-04A`).
- Hover state: Subdued `rgba(255, 255, 255, 0.02)` background highlight across row.

### Telemetry Stream & Event Log
- Monospaced event feeds (`JetBrains Mono`, 12px) tracking real-time line telemetry: timestamp (`#64748B`), machine identifier (`#94A3B8`), event payload (`#E2E8F0`), and differential value tagged in semantic color.