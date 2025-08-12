module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/project'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
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
};
