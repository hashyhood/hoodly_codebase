module.exports = {
  roots: ['<rootDir>/project'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/project/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/project/$1'
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-async-storage)/)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/project'],
  testPathIgnorePatterns: [
    '<rootDir>/project/app/',
    '<rootDir>/project/components/',
    '<rootDir>/project/lib/'
  ]
};
