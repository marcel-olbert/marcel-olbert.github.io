// Tells TypeScript that .yaml imports are valid — @rollup/plugin-yaml
// (see astro.config.mjs) turns them into JS objects at build time.
declare module '*.yaml' {
  const value: any;
  export default value;
}

// Self-hosted font packages are pure CSS side-effect imports (no JS types).
declare module '@fontsource-variable/fraunces';
declare module '@fontsource-variable/inter';
