export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Neural Network Colors
  neural: {
    background: string;
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  };
  
  // Glass Effects
  glass: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    border: string;
  };
  
  // Text Colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Gradient Arrays
  gradients: {
    neural: string[];
    cyber: string[];
    sunset: string[];
    aurora: string[];
    plasma: string[];
    ocean: string[];
  };
  
  // Status Colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Interactive Colors
  interactive: {
    primary: string;
    secondary: string;
    disabled: string;
    pressed: string;
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeShadows {
  sm: object;
  md: object;
  lg: object;
  neural: object;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
}

// Dark Theme
const darkColors: ThemeColors = {
  neural: {
    background: '#0a0a0f',
    primary: '#00d4ff',
    secondary: '#ff6b9d',
    tertiary: '#7c3aed',
    accent: '#fbbf24',
  },
  glass: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    tertiary: 'rgba(255, 255, 255, 0.02)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    inverse: '#000000',
  },
  gradients: {
    neural: ['#00d4ff', '#0099cc'],
    cyber: ['#ff6b9d', '#c44569'],
    sunset: ['#ff9ff3', '#f368e0'],
    aurora: ['#54a0ff', '#2e86de'],
    plasma: ['#5f27cd', '#341f97'],
    ocean: ['#00d2d3', '#54a0ff'],
  },
  status: {
    success: '#00d4aa',
    warning: '#ff9ff3',
    error: '#ff6b6b',
    info: '#54a0ff',
  },
  interactive: {
    primary: '#00d4ff',
    secondary: '#ff6b9d',
    disabled: 'rgba(255, 255, 255, 0.3)',
    pressed: 'rgba(0, 212, 255, 0.3)',
  },
};

// Light Theme
const lightColors: ThemeColors = {
  neural: {
    background: '#f8fafc',
    primary: '#0066cc',
    secondary: '#e91e63',
    tertiary: '#7c3aed',
    accent: '#f59e0b',
  },
  glass: {
    primary: 'rgba(255, 255, 255, 0.9)',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.1)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  gradients: {
    neural: ['#0066cc', '#004499'],
    cyber: ['#e91e63', '#ad1457'],
    sunset: ['#ff6b9d', '#c44569'],
    aurora: ['#3b82f6', '#1d4ed8'],
    plasma: ['#7c3aed', '#5b21b6'],
    ocean: ['#06b6d4', '#0891b2'],
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  interactive: {
    primary: '#0066cc',
    secondary: '#e91e63',
    disabled: 'rgba(0, 0, 0, 0.3)',
    pressed: 'rgba(0, 102, 204, 0.3)',
  },
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const radius: ThemeRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const shadows: ThemeShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  neural: {
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Default theme (dark)
export const theme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  shadows,
};

// Theme switching function
export const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  shadows,
});

// Theme context for React
export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkColors : lightColors;
}; 