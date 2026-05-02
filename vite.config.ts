import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Stub server-only modules (`pg`, `src/db`, `src/lib/auth`) when bundling for
// the *browser*. Leave them untouched for SSR (`opts.ssr === true`) so the
// real implementations run there.
//
// Why this exists: many server-only files (claim-server.ts, listing-server.ts,
// notification-server.ts, etc.) statically `import { db } from '../db'`, and
// the generated route tree statically imports every route file. TanStack
// Start strips server-fn handler *bodies* on the client, but Vite's dep
// scanner still walks the file-level imports. Without intervention this
// pulls `pg` (and its top-level Buffer / EventEmitter / DATABASE_URL checks)
// into the client bundle, where evaluation crashes — killing React hydration
// and leaving the SSR HTML inert (tabs/buttons appear dead). The stubs let
// the import graph resolve cleanly; the real code is never *called* in the
// browser because the server-fn handlers that would call it are stripped.
function stubServerOnlyForClient(): Plugin {
  const PG_STUB = '\0virtual:pg-client-stub'
  const DB_STUB = '\0virtual:db-client-stub'
  const AUTH_STUB = '\0virtual:auth-client-stub'

  const isPg = (s: string) => s === 'pg' || s.startsWith('pg/')
  const isDb = (s: string) =>
    /(?:^|\/)src\/db(?:\/index)?(?:\.[tj]sx?)?$/.test(s) ||
    /\.\.?(?:\/\.\.)*\/db$/.test(s) ||
    /\.\.?(?:\/\.\.)*\/db\/index(?:\.[tj]sx?)?$/.test(s)
  const isAuth = (s: string) =>
    /(?:^|\/)src\/lib\/auth(?:\.[tj]sx?)?$/.test(s) ||
    /\.\.?(?:\/\.\.)*\/lib\/auth$/.test(s) ||
    /\.\.?(?:\/\.\.)*\/auth$/.test(s)

  return {
    name: 'foodsetu:stub-server-only-for-client',
    enforce: 'pre',
    resolveId(source, importer, opts) {
      if (opts && (opts as { ssr?: boolean }).ssr) return null
      if (isPg(source)) return PG_STUB
      // For `db` / `auth` the same relative path is used in many places
      // (`../db`, `../../db`, `./auth`, etc.) — only intercept when the
      // importer lives under our own src/ tree to avoid touching node_modules
      // that happen to expose a `db`/`auth` path.
      if (importer && /\/src\//.test(importer)) {
        if (isDb(source)) return DB_STUB
        // Don't stub auth-server / auth-client — only the raw `auth` module
        // (auth.ts) which boots Better Auth + opens a pg pool.
        if (isAuth(source) && !/auth-(server|client)/.test(source)) {
          return AUTH_STUB
        }
      }
      return null
    },
    load(id) {
      if (id === PG_STUB) {
        return [
          '// Client stub for `pg`.',
          'class Pool { constructor() {} async query() { throw new Error("pg not available in browser") } async connect() { throw new Error("pg not available in browser") } async end() {} on() { return this } }',
          'class Client { constructor() {} async connect() { throw new Error("pg not available in browser") } async query() { throw new Error("pg not available in browser") } async end() {} on() { return this } }',
          'const types = { setTypeParser: () => {}, getTypeParser: () => (v) => v, builtins: {} };',
          'export { Pool, Client, types };',
          'export default { Pool, Client, types };',
        ].join('\n')
      }
      if (id === DB_STUB) {
        return [
          '// Client stub for `src/db`. Server-fn handlers that read `db` are',
          '// stripped on the client, so the proxy is never actually invoked.',
          'const handler = { get() { throw new Error("db is server-only") } };',
          'export const db = new Proxy({}, handler);',
          'export default db;',
        ].join('\n')
      }
      if (id === AUTH_STUB) {
        return [
          '// Client stub for `src/lib/auth`. Better Auth and the pg Pool',
          '// only ever run on the server.',
          'const poolHandler = { get() { throw new Error("pool is server-only") } };',
          'const authHandler = { get() { throw new Error("auth is server-only") } };',
          'export const pool = new Proxy({}, poolHandler);',
          'export const auth = new Proxy({}, authHandler);',
        ].join('\n')
      }
      return null
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  plugins: [
    stubServerOnlyForClient(),
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
