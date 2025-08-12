// Configuration file for Hoodly app
export const CONFIG = {
  // Supabase Configuration
  SUPABASE: {
    URL: 'https://ikeocbgjivpifvwzllkm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0',
  },
  
  // API Configuration - Using Supabase directly
  API: {
    // Development
    DEV: {
      SOCKET_URL: null, // Disabled since we use Supabase Realtime
      API_URL: 'https://ikeocbgjivpifvwzllkm.supabase.co',
    },
    // Production
    PROD: {
      SOCKET_URL: null, // Disabled since we use Supabase Realtime
      API_URL: 'https://ikeocbgjivpifvwzllkm.supabase.co',
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
  },

  // Timeouts and Intervals
  TIMEOUTS: {
    TYPING_INDICATOR: 1000, // 1 second
    RECONNECTION_DELAY: 5000, // 5 seconds
    AUTO_SCROLL_DELAY: 100, // 100ms
    SEARCH_DEBOUNCE: 300, // 300ms
    MESSAGE_SEND_TIMEOUT: 10000, // 10 seconds
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 50,
    LOAD_MORE_THRESHOLD: 0.1,
  },

  // Message Limits
  MESSAGES: {
    MAX_CONTENT_LENGTH: 1000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // User Limits
  USERS: {
    MAX_INTERESTS: 5,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 6,
  },
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