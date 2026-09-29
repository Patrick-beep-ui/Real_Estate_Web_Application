// Jest shim for the `server-only` package, which only exists to make bundlers
// throw if server code leaks into a client bundle. Under Jest there is no
// bundler, so the module resolves to this no-op instead.
export {};
