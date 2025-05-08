module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // 一定要放最後
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 自訂規則，例：
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
