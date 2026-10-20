// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

/**
 * Las capas del frontend (módulo 40). Cada carpeta es un "element" de eslint-plugin-boundaries; el
 * primero cuyo patrón encaja gana. `feature` se captura de la ruta para poder decir "de SU feature".
 */
const ELEMENTOS = [
  { type: 'page', pattern: 'src/app/features/*/pages/*', capture: ['feature', 'page'] },
  { type: 'component', pattern: 'src/app/features/*/components', capture: ['feature'] },
  { type: 'service', pattern: 'src/app/features/*/services', capture: ['feature'] },
  { type: 'interfaces', pattern: 'src/app/features/*/interfaces', capture: ['feature'] },
  { type: 'feature', pattern: 'src/app/features/*', capture: ['feature'] }, // *.routes.ts, *.config.ts
  { type: 'core-api', pattern: 'src/app/core/api' },
  { type: 'core', pattern: 'src/app/core' },
  { type: 'shared-utils', pattern: 'src/app/shared/utils' },
  { type: 'shared-interfaces', pattern: 'src/app/shared/interfaces' },
  { type: 'shared', pattern: 'src/app/shared' },
  { type: 'labs', pattern: 'src/app/labs' },
  { type: 'testing', pattern: 'src/app/testing' },
  { type: 'environments', pattern: 'src/environments' },
  { type: 'app', pattern: 'src/app' }, // app.ts, app.config.ts, app.routes.ts
  { type: 'main', pattern: 'src' }, // main.ts
];

const MISMA = { feature: '{{from.element.captured.feature}}' };
const SHARED = ['shared', 'shared-utils', 'shared-interfaces'];
const CORE = ['core', 'core-api'];

/** Quién puede importar a quién. Lo que no está aquí, está prohibido (default: 'disallow'). */
const REGLAS = [
  {
    from: 'page',
    to: [
      { type: ['component', 'service', 'interfaces', 'feature'], captured: MISMA },
      { type: [...CORE, ...SHARED] },
    ],
  },
  {
    from: 'component',
    to: [{ type: ['component', 'interfaces'], captured: MISMA }, { type: SHARED }],
  },
  {
    from: 'service',
    to: [
      { type: ['service', 'interfaces', 'feature'], captured: MISMA },
      { type: [...CORE, 'shared-utils', 'shared-interfaces'] },
    ],
  },
  {
    from: 'interfaces',
    to: [{ type: 'interfaces', captured: MISMA }, { type: ['core-api', 'shared-interfaces'] }],
  },
  {
    from: 'feature',
    to: [{ type: ['page', 'service', 'feature'], captured: MISMA }, { type: CORE }],
  },
  { from: 'core', to: [{ type: [...CORE, ...SHARED, 'environments'] }] },
  { from: 'core-api', to: [{ type: 'core-api' }] },
  { from: 'shared', to: [{ type: SHARED }] },
  { from: 'shared-utils', to: [{ type: ['shared-utils', 'shared-interfaces'] }] },
  { from: 'shared-interfaces', to: [{ type: 'shared-interfaces' }] },
  // los laboratorios de los módulos reutilizan las APIs falsas y los modelos de las features
  { from: 'labs', to: [{ type: ['labs', ...CORE, ...SHARED, 'service', 'interfaces'] }] },
  {
    from: 'app',
    to: [{ type: ['app', ...CORE, ...SHARED, 'labs', 'environments', 'page', 'feature'] }],
  },
  { from: 'main', to: [{ type: 'app' }] },
  { from: 'testing', to: [{ type: ['testing', ...CORE, ...SHARED] }] },
];

module.exports = defineConfig([
  globalIgnores(['src/app/core/api/schema.d.ts']), // lo genera openapi-typescript (módulo 51)
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // los no-op son intencionados: callbacks por defecto de un ControlValueAccessor, stubs de tests
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // un <h3>/<a> vacío está bien si su texto lo pone la directive appResaltar (módulo 43)
      '@angular-eslint/template/elements-content': ['error', { allowList: ['appResaltar'] }],
    },
  },
  // ── Fronteras entre features, core y shared ──
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.spec.ts'], // un test monta lo que necesite (y solo él puede importar testing/)
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.js'] } },
      'boundaries/elements': ELEMENTOS,
    },
    rules: {
      'boundaries/no-unknown-files': 'error', // cada archivo, en una capa conocida
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{from.element.types}}{{#if from.element.captured.feature}} «{{from.element.captured.feature}}»{{/if}} ' +
            'no puede importar {{to.element.types}}{{#if to.element.captured.feature}} «{{to.element.captured.feature}}»{{/if}} ' +
            '(reglas de dependencia del módulo 40)',
          policies: REGLAS.map(({ from, to }) => ({
            from: { element: { type: from } },
            allow: { to: to.map((elemento) => ({ element: elemento })) },
          })),
        },
      ],
    },
  },
  // ── HTTP solo en los services de cada feature y en core ──
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/app/features/*/services/**',
      'src/app/core/**',
      'src/app/testing/**',
      'src/app/app.config.ts', // provideHttpClient y los interceptores: la composición de la app
      '**/*.spec.ts',
    ],
    rules: {
      // fetch() también es HTTP, y además se salta los interceptors (sin token ni ErrorApi)
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'HTTP solo en features/<feature>/services/ y en core/: pide los datos al service de tu feature.',
        },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common/http',
              message:
                'HTTP solo en features/<feature>/services/ y en core/: pide los datos al service de tu feature.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
