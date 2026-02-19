const path = require('path'); // 导入 path 模块

module.exports = {
  // root: true, // 移除 root: true
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended' // 确保这是最后一个，以覆盖其他格式规则
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: path.resolve(__dirname, './tsconfig.json') // 使用绝对路径
  },
  env: {
    node: true,
    es6: true
  },
  rules: {
    // 在这里添加或覆盖自定义规则
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    '.eslintrc.js'
  ]
};
