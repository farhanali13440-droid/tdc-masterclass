// Minimal typing so the app typecheck accepts Bun's built-in test module.
declare module "bun:test" {
  export const test: (name: string, fn: () => unknown) => void;
  export const beforeEach: (fn: () => unknown) => void;
  export const expect: any;
  export const mock: any;
}
