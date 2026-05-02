/**
 * SEO helpers shared across routes. Centralised so that the canonical site
 * URL, default OG image, and noindex flags live in one place.
 *
 * `SITE_URL` should be the production origin without a trailing slash. Set the
 * `VITE_SITE_URL` env var in deployment to override the default.
 */

export const SITE_URL: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_SITE_URL?: string } }).env
      ?.VITE_SITE_URL) ||
  'https://foodsetu.app'

export const SITE_NAME = 'FoodSetu'

export const DEFAULT_DESCRIPTION =
  'FoodSetu connects restaurants and bakeries with verified NGOs and animal rescues to redirect surplus food before it goes to waste. Free, audited, OTP-secured handoffs across Nepal.'

export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&h=630&auto=format&fit=crop&q=80'

type PageSeoInput = {
  title: string
  description?: string
  path?: string
  image?: string
  /** Set to true for private/authed pages so search engines skip them. */
  noindex?: boolean
}

type MetaTag = Record<string, string>

/**
 * Build a `head:` config for a route — title, description, OpenGraph, Twitter
 * card, canonical link, and (optional) robots noindex. Designed to plug into
 * TanStack Router's `createFileRoute(...).head: () => ({...})`.
 */
export function pageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  noindex = false,
}: PageSeoInput): { meta: MetaTag[]; links: MetaTag[] } {
  const fullTitle =
    title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const meta: MetaTag[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    },
    // OpenGraph
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'en_US' },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]

  const links: MetaTag[] = [{ rel: 'canonical', href: url }]

  return { meta, links }
}
