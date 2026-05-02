import { createServerFn } from '@tanstack/react-start'

// NOTE: this file is imported by public route files (`/login`, `/register`),
// so its top-level imports MUST stay client-safe. The TanStack Start compiler
// strips the handler body for the client bundle, so we lazy-import the
// node-only modules (`auth`, `getRequest`) inside the handler — keeping `pg`
// out of the client bundle, which would otherwise crash hydration with
// `Buffer is not defined`.

export const getServerSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('./auth')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return session
  },
)
