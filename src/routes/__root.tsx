import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'FoodSetu — surplus food, picked up fast',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
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
        {children}
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
