import nestConfig from '@mediashelf/eslint-config/nest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nestConfig,
  {
    ignores: ['prisma/seed.js'],
  },
];
