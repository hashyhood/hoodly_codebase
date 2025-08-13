// Jest setup for React Native/Expo testing
require('react-native-gesture-handler/jestSetup');

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  useRootNavigationState: () => ({ isReady: true }),
  useRootNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: { front: 'front', back: 'back' },
  FlashMode: { on: 'on', off: 'off' },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => 'MapView');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(),
  useAnimatedStyle: jest.fn(),
  withSpring: jest.fn(),
  withTiming: jest.fn(),
  runOnJS: jest.fn(),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  State: {},
  Directions: {},
  gestureHandlerRootHOC: jest.fn(),
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  TouchableHighlight: 'TouchableHighlight',
  TouchableNativeFeedback: 'TouchableNativeFeedback',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: 'SafeAreaView',
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
  ScreenStack: 'ScreenStack',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
}));

// Global test setup
global.__DEV__ = true;

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalWarn(...args);
};
