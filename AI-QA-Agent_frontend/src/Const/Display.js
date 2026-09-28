/**
 * Design System Constants: Colors, Font Sizes, Shadows, and Theme Tokens
 * AI QA Agent Platform
 */

export const COLORS = {
  // Brand & Accents
  primary: '#3b82f6',        // Electric Blue
  primaryGlow: 'rgba(59, 130, 246, 0.35)',
  primaryLight: '#60a5fa',
  primaryDark: '#1d4ed8',

  secondary: '#8b5cf6',      // Purple
  secondaryGlow: 'rgba(139, 92, 246, 0.35)',
  cyan: '#06b6d4',           // Cyan
  emerald: '#10b981',        // Success Emerald
  amber: '#f59e0b',          // Warning Amber
  rose: '#f43f5e',           // Critical Rose

  // Backgrounds (Dark Glassmorphic Palette)
  bgDarkest: '#090a0f',      // Deep space canvas
  bgDark: '#0e111a',         // Main workspace background
  bgCard: '#131826',         // Card background
  bgCardHover: '#1a2033',    // Card hover state
  bgElevated: '#1a2238',     // Modals / dropdowns
  bgInput: '#0d121f',        // Input fields

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderDefault: '#1f293d',
  borderHighlight: 'rgba(59, 130, 246, 0.4)',
  borderActive: '#3b82f6',

  // Typography Colors
  textPrimary: '#f8fafc',    // Bright headings / primary text
  textSecondary: '#94a3b8',  // Secondary labels / descriptions
  textMuted: '#64748b',      // Subdued metadata / captions
  textWhite: '#ffffff',
  textDisabled: '#475569',

  // Severity Status Colors
  severity: {
    critical: {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      glow: 'rgba(244, 63, 94, 0.25)',
      label: 'Critical',
    },
    high: {
      color: '#fb923c',
      bg: 'rgba(251, 146, 60, 0.12)',
      border: 'rgba(251, 146, 60, 0.3)',
      glow: 'rgba(251, 146, 60, 0.25)',
      label: 'High',
    },
    medium: {
      color: '#facc15',
      bg: 'rgba(250, 204, 21, 0.12)',
      border: 'rgba(250, 204, 21, 0.3)',
      glow: 'rgba(250, 204, 21, 0.25)',
      label: 'Medium',
    },
    low: {
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.3)',
      glow: 'rgba(56, 189, 248, 0.25)',
      label: 'Low',
    },
    passed: {
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.3)',
      glow: 'rgba(52, 211, 153, 0.25)',
      label: 'Passed',
    },
  },

  // Scan Status Colors
  status: {
    running: {
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.15)',
      border: 'rgba(96, 165, 250, 0.35)',
      label: 'Scanning In-Progress',
    },
    complete: {
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.15)',
      border: 'rgba(52, 211, 153, 0.35)',
      label: 'Scan Completed',
    },
    failed: {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      label: 'Scan Failed',
    },
    queued: {
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.35)',
      label: 'Queued',
    },
  },
};

export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',      // 16px
  md: '1.125rem',   // 18px
  lg: '1.25rem',    // 20px
  xl: '1.5rem',     // 24px
  '2xl': '1.875rem',// 30px
  '3xl': '2.25rem', // 36px
  '4xl': '3rem',    // 48px
  display: '3.75rem'// 60px
};

export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
};

export const SHADOWS = {
  card: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  glowBlue: '0 0 25px rgba(59, 130, 246, 0.25)',
  glowPurple: '0 0 25px rgba(139, 92, 246, 0.25)',
  glowRose: '0 0 25px rgba(244, 63, 94, 0.25)',
  innerGlow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
};

export const BORDER_RADIUS = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',
};

export default {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  BORDER_RADIUS,
};
