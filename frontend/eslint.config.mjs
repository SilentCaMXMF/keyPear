import { defineConfig } from 'eslint/config';
import astro from 'eslint-config-astro';

const eslintConfig = defineConfig([
  ...astro,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'dist/**'],
  },
]);

export default eslintConfig;
