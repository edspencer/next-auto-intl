import typescript from 'rollup-plugin-typescript2';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  peerDepsExternal(), // Automatically externalize peer dependencies
  resolve(), // Resolve modules from node_modules
  commonjs({
    include: '/node_modules/',
  }), // Convert CommonJS modules to ES6
  typescript({
    tsconfig: './tsconfig.json',
    useTsconfigDeclarationDir: true,
    exclude: ['test/**/*', 'src/script/**/*'], // Exclude test files
  }),
];

const externalDependencies = [
  'fs',
  'path',
  'child_process',
  'glob',
  'commander',
  '@babel/traverse',
  '@babel/types',
  '@babel/parser',
  '@babel/generator',
  'zod',
  'slugify',
  'p-limit',
  '@ai-sdk/openai',
  'ai',
  'deepmerge',
];

const watchConfig = {
  include: ['src/**', 'bin/**'],
};

export default [
  // Library Build
  {
    input: './src/index.ts',
    output: [
      {
        file: './dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].mjs',
      },
      {
        file: './dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].cjs',
      },
    ],
    plugins,
    external: externalDependencies,
    watch: watchConfig,
  },

  // CLI Build
  {
    input: './bin/cli.ts',
    output: {
      dir: './dist/bin', // Output directory for CLI files
      format: 'esm', // CLI as ESM (produces .mjs)
      sourcemap: true,
      entryFileNames: '[name].mjs', // Ensure CLI filename matches conventions
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true,
        exclude: ['test/**/*', 'src/script/**/*'],
      }),
      copy({
        targets: [{ src: 'bin/auto-intl.config.mjs', dest: 'dist/bin' }],
      }),
    ],
    external: externalDependencies,
    watch: watchConfig,
  },
];
