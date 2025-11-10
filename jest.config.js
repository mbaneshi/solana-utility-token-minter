module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/cli', '<rootDir>/scripts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/token/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
    '!src/config.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    'src/token/operations.ts': {
      branches: 80,
      functions: 65,
      lines: 75,
      statements: 75,
    },
    'src/utils/wallet.ts': {
      branches: 50,
      functions: 75,
      lines: 70,
      statements: 70,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
};
