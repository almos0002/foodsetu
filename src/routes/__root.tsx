import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../lib/seo'
import { ToastProvider } from '../components/ui/Toast'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      // Default title — child routes override via their own `head:`.
      { title: `${SITE_NAME} — surplus food, picked up fast` },
      { name: 'description', content: DEFAULT_DESCRIPTION },
      { name: 'application-name', content: SITE_NAME },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },
      { name: 'theme-color', content: '#FF6A1F' },
      { name: 'color-scheme', content: 'light' },
      { name: 'format-detection', content: 'telephone=no' },
      // Default robots — authed routes override to noindex.
      { name: 'robots', content: 'index, follow' },
      // OpenGraph defaults (overridden per-page).
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: `${SITE_NAME} — surplus food, picked up fast` },
      { property: 'og:description', content: DEFAULT_DESCRIPTION },
      { property: 'og:image', content: DEFAULT_OG_IMAGE },
      { property: 'og:url', content: SITE_URL },
      // Twitter defaults.
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `${SITE_NAME} — surplus food, picked up fast` },
      { name: 'twitter:description', content: DEFAULT_DESCRIPTION },
      { name: 'twitter:image', content: DEFAULT_OG_IMAGE },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/logo192.png', type: 'image/png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@400;500;600;700&display=swap',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/logo512.png`,
          description: DEFAULT_DESCRIPTION,
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootDocument,
})

// Minimal `Buffer` stub injected before any ESM modules evaluate.
// Background: Vite dev pre-bundles `pg` into the client deps cache because
// many server-only files (claim-server.ts, listing-server.ts, etc.) statically
// `import { db } from '../db'` and the route tree statically imports those
// route files. TanStack Start strips server-fn handler *bodies* on the client,
// but the file-level imports are still scanned. The bundled pg evaluates at
// load time and references `Buffer.from`, throwing `Buffer is not defined`,
// which kills hydration → tabs/buttons appear inert. The stub lets the chunk
// finish evaluating; the actual pg code is never *called* on the client.
const BUFFER_STUB = `if(typeof window!=="undefined"&&typeof window.Buffer==="undefined"){window.Buffer={from:function(x){return x},alloc:function(){return{}},allocUnsafe:function(){return{}},isBuffer:function(){return false},concat:function(a){return a},byteLength:function(s){return typeof s==="string"?s.length:0}};}`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: BUFFER_STUB }}
        />
        <HeadContent />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
