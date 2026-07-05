// Tells TypeScript that .yaml imports are valid — @rollup/plugin-yaml
// (see astro.config.mjs) turns them into JS objects at build time.
declare module '*.yaml' {
  const value: any;
  export default value;
}
