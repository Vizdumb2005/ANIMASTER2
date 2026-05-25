import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'no-case-declarations': 'off',
      'prefer-const': 'off',
    },
    ignores: ['dist/', 'node_modules/', '**/*.js', '**/*.jsx']
  }
);
