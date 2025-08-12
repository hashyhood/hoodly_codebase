// Hoodly Dark Glass Theme System
export const theme = {
  name: "NearBuzz/Hoodly Dark Glass",
  colors: {
    bg: "#0B0F14",
    surface: "rgba(255,255,255,0.05)",
    surfaceStrong: "rgba(255,255,255,0.08)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.70)",
    textTertiary: "rgba(255,255,255,0.55)",
    muted: "#1A2330",
    divider: "rgba(255,255,255,0.08)",
    success: "#4CC38A",
    warning: "#F5A524",
    error: "#FF5D5D",
    navy: "#0E1420"
  },
  gradients: {
    primary: ["#FF6AA2", "#7DE1DA"],
    fab: ["#FF71B8", "#7DE1DA"],
    chipActive: ["#FF6AA2", "#7DE1DA"],
    storyRing: ["#6B8BFF", "#FF7BD7", "#7DE1DA"]
  },
  radii: {
    xs: 10,
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
    pill: 999
  },
  shadows: {
    soft: {
      color: "rgba(0,0,0,0.45)",
      offsetY: 6,
      blur: 20
    }
  },
  blur: {
    card: 12,
    bar: 16
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32
  },
  typography: {
    family: "SF Pro / Inter",
    titleXL: { size: 32, weight: "700", lineHeight: 38 },
    title: { size: 24, weight: "700", lineHeight: 30 },
    subtitle: { size: 13, weight: "400", lineHeight: 18, opacity: 0.7 },
    body: { size: 15, weight: "400", lineHeight: 22 },
    caption: { size: 12, weight: "400", lineHeight: 16, opacity: 0.7 }
  },
  components: {
    chip: {
      height: 36,
      padH: 14,
      inactiveBg: "#1A2330",
      inactiveText: "rgba(255,255,255,0.75)"
    },
    input: {
      height: 48,
      radius: 18,
      bg: "rgba(255,255,255,0.06)",
      placeholder: "rgba(255,255,255,0.45)"
    },
    card: {
      radius: 22,
      pad: 16,
      bg: "rgba(255,255,255,0.05)",
      divider: "rgba(255,255,255,0.08)"
    },
    fab: {
      size: 64,
      shadow: "soft"
    },
    tabbar: {
      height: 86,
      bg: "#0E1420",
      pointer: { size: 10, offset: -6 }
    },
    spinner: {
      size: 28,
      textOpacity: 0.75
    },
    toast: {
      radius: 16,
      padV: 12,
      padH: 14
    }
  }
} as const;

// Type exports
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeGradients = typeof theme.gradients;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeRadii = typeof theme.radii;
export type ThemeTypography = typeof theme.typography;
export type ThemeComponents = typeof theme.components;

// Constants for common measurements
export const HEADER_HEIGHT = 120;
export const TABBAR_HEIGHT = theme.components.tabbar.height;
export const CARD_RADIUS = theme.components.card.radius;
export const CHIP_HEIGHT = theme.components.chip.height;
export const FAB_SIZE = theme.components.fab.size;

// Utility functions
export const getGradient = (type: keyof ThemeGradients) => theme.gradients[type];
export const getColor = (color: keyof ThemeColors) => theme.colors[color];
export const getSpacing = (size: keyof ThemeSpacing) => theme.spacing[size];
export const getRadius = (size: keyof ThemeRadii) => theme.radii[size]; 