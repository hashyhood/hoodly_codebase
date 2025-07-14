// Configuration file for Hoodly app
export const CONFIG = {
  // Supabase Configuration
  SUPABASE: {
    URL: 'https://ikeocbgjivpifvwzllkm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0',
  },
  
  // API Configuration
  API: {
    // Development
    DEV: {
      SOCKET_URL: 'http://192.168.18.232:5002',
      API_URL: 'http://192.168.18.232:5002/api',
    },
    // Production
    PROD: {
      SOCKET_URL: 'https://your-hoodly-backend.com',
      API_URL: 'https://your-hoodly-backend.com/api',
    }
  },
  
  // App Configuration
  APP: {
    NAME: 'Hoodly',
    VERSION: '2.0.0',
    DESCRIPTION: 'Hyper-local Social Networking App',
  },
  
  // Features
  FEATURES: {
    ENABLE_LOCATION: true,
    ENABLE_CAMERA: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_OFFLINE_MODE: true,
  },
  
  // UI Configuration
  UI: {
    PRIMARY_COLOR: '#FF6B9D',
    SECONDARY_COLOR: '#4A90E2',
    BACKGROUND_COLOR: '#1a1a2e',
    TEXT_COLOR: '#FFFFFF',
  }
};

// Get current environment
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Get API configuration based on environment
export const getApiConfig = () => {
  return isDevelopment ? CONFIG.API.DEV : CONFIG.API.PROD;
};

// Get socket URL
export const getSocketUrl = () => {
  return getApiConfig().SOCKET_URL;
};

// Get API URL
export const getApiUrl = () => {
  return getApiConfig().API_URL;
};

// Supabase configuration
export const supabaseUrl = CONFIG.SUPABASE.URL;
export const supabaseAnonKey = CONFIG.SUPABASE.ANON_KEY; 