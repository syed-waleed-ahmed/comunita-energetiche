module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@ce/packages-core$': '<rootDir>/../core/src/index.ts',
    '^@ce/db$': '<rootDir>/../db/src/index.ts',
  },
};
