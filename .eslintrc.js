module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  globals: {
    globalThis: 'readonly',
    confirm: 'readonly',
    alert: 'readonly'
  },
  rules: {
    'no-restricted-globals': 'off',
    'no-undef': 'off'
  },
  overrides: [
    {
      files: [
        'src/features/**/presentation/**/*.js',
        'src/features/**/application/**/*.js',
        'src/components/**/*.js'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/config/supabase', '**/services/**'],
                message: 'Usa repositorios/adaptadores de infrastructure o modulos shared en lugar de importar supabase/services directamente.'
              },
              {
                group: ['./index', '../index', '../../index', '../../../index', '../../../../index'],
                message: 'Evita importar desde index en presentation/application para prevenir ciclos; importa desde *Service.js o modulo especifico.'
              }
            ]
          }
        ]
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
};
