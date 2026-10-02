// Industrial Control Design Tokens - Coral x Teal Theme

export const colors = {
  // Canvas & Surfaces
  canvas: '#0B0B0D',
  surface: '#141416',
  surfaceElevated: '#1B1B1F',
  surfaceDim: '#0B0B0D',
  surfaceContainerLowest: '#0B0B0D',
  surfaceContainerLow: '#141416',
  surfaceContainer: '#1B1B1F',
  surfaceContainerHigh: '#222227',
  surfaceContainerHighest: '#2A2A32',
  surfaceBright: '#32323C',

  // Coral Palette (Alerts, Warnings, Critical, Primary Action CTAs)
  coral: '#FF6B5A',
  coralHover: '#FF8070',
  coralPressed: '#E65A4A',
  coralTint: 'rgba(255, 107, 90, 0.12)',

  // Teal Palette (Telemetry, Primary Brand, Running, Nominal, Savings)
  teal: '#14B8A6',
  tealHover: '#2DD4BF',
  tealPressed: '#0F9A8B',
  tealTint: 'rgba(20, 184, 166, 0.12)',

  // Primary Telemetry Accent (Teal)
  primary: '#14B8A6',
  primaryHover: '#2DD4BF',
  primaryPressed: '#0F9A8B',
  primaryTint: 'rgba(20, 184, 166, 0.12)',
  primaryContainer: '#0F9A8B',
  primaryFixed: '#2DD4BF',
  primaryDim: '#14B8A6',
  onPrimary: '#0B0B0D',

  // Secondary & Alerts / Highlights (Coral)
  secondary: '#FF6B5A',
  secondaryHover: '#FF8070',
  secondaryPressed: '#E65A4A',
  secondaryContainer: 'rgba(255, 107, 90, 0.16)',
  onSecondary: '#0B0B0D',

  // Tertiary & Critical (Coral)
  tertiary: '#FF6B5A',
  tertiaryContainer: 'rgba(255, 107, 90, 0.16)',
  error: '#FF6B5A',
  errorContainer: 'rgba(255, 107, 90, 0.16)',

  // Typography & Neutral Slates
  textPrimary: '#F5F5F4',
  textSecondary: '#A8A29E',
  textMuted: '#78716C',
  onSurface: '#F5F5F4',
  onSurfaceVariant: '#A8A29E',
  outline: '#78716C',
  outlineVariant: 'rgba(255, 255, 255, 0.08)',

  // Hairlines & Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(255, 255, 255, 0.16)',
} as const;

export const typography = {
  fontFamilies: {
    sans: "'Inter', sans-serif",
    grotesk: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;

export const spacing = {
  gutter: '1rem',
  margin: '1.5rem',
  spaceXs: '0.25rem', // 4px
  spaceSm: '0.5rem',  // 8px
  spaceMd: '1rem',    // 16px
  spaceLg: '1.5rem',  // 24px
  spaceXl: '2rem',    // 32px
} as const;
