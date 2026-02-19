module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  // 忽略 dist 和 node_modules 目录
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // 模块名映射，用于处理路径别名或特定模块的导入
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 收集测试覆盖率
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts', // 不收集入口文件的覆盖率
    '!src/config/*.ts', // 不收集配置文件的覆盖率
    '!src/models/*.ts', // 模型的测试可能更适合集成测试
    '!src/middleware/authMiddleware.ts', // 中间件在集成测试中被使用
    '!src/routes/*.ts', // 路由在集成测试中被使用
  ],
};
