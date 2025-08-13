module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
  collectCoverageFrom: [
    'project/**/*.{ts,tsx}',
    '!project/**/*.d.ts',
    '!project/**/node_modules/**',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/project/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/project/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  collectCoverage: false, // Set to true if you want coverage reports
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
