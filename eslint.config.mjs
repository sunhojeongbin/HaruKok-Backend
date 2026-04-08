// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['src/modules/auth/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../infrastructure/**', '../services/**'],
              message:
                'presentation 계층에서는 infrastructure/services를 직접 참조하지 말고 application/use-cases를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/auth/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../presentation/**', '../../presentation/**'],
              message:
                'application 계층에서는 presentation 계층을 참조할 수 없어요.',
            },
            {
              group: ['../infrastructure/**', '../../infrastructure/**'],
              message:
                'application 계층에서는 infrastructure를 직접 참조하지 말고 port를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/ctg/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../infrastructure/**', '../domain/**'],
              message:
                'presentation 계층에서는 infrastructure/domain을 직접 참조하지 말고 application/use-cases를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/ctg/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../presentation/**', '../../presentation/**'],
              message:
                'application 계층에서는 presentation 계층을 참조할 수 없어요.',
            },
            {
              group: ['../infrastructure/**', '../../infrastructure/**'],
              message:
                'application 계층에서는 infrastructure를 직접 참조하지 말고 port를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/todo/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../infrastructure/**', '../domain/**'],
              message:
                'presentation 계층에서는 infrastructure/domain을 직접 참조하지 말고 application/use-cases를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/todo/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../presentation/**', '../../presentation/**'],
              message:
                'application 계층에서는 presentation 계층을 참조할 수 없어요.',
            },
            {
              group: ['../infrastructure/**', '../../infrastructure/**'],
              message:
                'application 계층에서는 infrastructure를 직접 참조하지 말고 port를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/rtn/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../infrastructure/**', '../domain/**'],
              message:
                'presentation 계층에서는 infrastructure/domain을 직접 참조하지 말고 application/use-cases를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/rtn/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../presentation/**', '../../presentation/**'],
              message:
                'application 계층에서는 presentation 계층을 참조할 수 없어요.',
            },
            {
              group: ['../infrastructure/**', '../../infrastructure/**'],
              message:
                'application 계층에서는 infrastructure를 직접 참조하지 말고 port를 통해 접근해 주세요.',
            },
          ],
        },
      ],
    },
  },
);
