import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth, pool } from './auth'

export type NotificationItem = {
  id: string
  title: string
  message: string
  href: string
  createdAt: string
  kind: 'info' | 'action' | 'warning'
}

export type NotificationsResponse = {
  items: NotificationItem[]
  unreadCount: number
}

export const getNotificationsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NotificationsResponse> => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return { items: [], unreadCount: 0 }
    }
    const user = session.user as { id: string; role?: string | null }
    const role = user.role ?? null
    const items: NotificationItem[] = []

    if (role === 'ADMIN') {
      const pendingOrgs = await pool.query(
        'SELECT id, name, "createdAt" FROM "organization" WHERE "verificationStatus" = $1 ORDER BY "createdAt" DESC LIMIT 10',
        ['PENDING'],
      )
      const openReports = await pool.query(
        'SELECT id, reason, created_at FROM reports WHERE status = $1 ORDER BY created_at DESC LIMIT 10',
        ['OPEN'],
      )
      for (const r of pendingOrgs.rows) {
        items.push({
          id: 'org-' + r.id,
          title: 'Organization awaiting verification',
          message: r.name ?? 'Unnamed organization',
          href: '/admin/organizations',
          createdAt: new Date(r.createdAt).toISOString(),
          kind: 'action',
        })
      }
      for (const r of openReports.rows) {
        items.push({
          id: 'report-' + r.id,
          title: 'Open report',
          message: String(r.reason ?? 'New issue reported').replace(/_/g, ' '),
          href: '/admin/reports',
          createdAt: new Date(r.created_at).toISOString(),
          kind: 'warning',
        })
      }
    } else if (role === 'RESTAURANT') {
      const orgRow = await pool.query(
        'SELECT "organizationId" AS org FROM "member" WHERE "userId" = $1 AND role = $2 LIMIT 1',
        [user.id, 'owner'],
      )
      const orgId = orgRow.rows[0]?.org as string | undefined
      if (orgId) {
        const requested = await pool.query(
          'SELECT c.id, c.created_at, l.title AS listing_title, o.name AS claimant FROM claims c JOIN food_listings l ON l.id = c.food_listing_id LEFT JOIN "organization" o ON o.id = c.claimant_org_id WHERE l.restaurant_id = $1 AND c.status = $2 ORDER BY c.created_at DESC LIMIT 15',
          [orgId, 'PENDING'],
        )
        for (const r of requested.rows) {
          items.push({
            id: 'claim-' + r.id,
            title: 'New claim request',
            message:
              (r.claimant ?? 'A claimant') +
              ' requested ' +
              (r.listing_title ?? 'your listing'),
            href: '/restaurant/claims',
            createdAt: new Date(r.created_at).toISOString(),
            kind: 'action',
          })
        }
      }
    } else if (role === 'NGO' || role === 'ANIMAL_RESCUE') {
      const orgRow = await pool.query(
        'SELECT "organizationId" AS org FROM "member" WHERE "userId" = $1 AND role = $2 LIMIT 1',
        [user.id, 'owner'],
      )
      const orgId = orgRow.rows[0]?.org as string | undefined
      if (orgId) {
        const accepted = await pool.query(
          'SELECT c.id, c.updated_at, l.title AS listing_title FROM claims c JOIN food_listings l ON l.id = c.food_listing_id WHERE c.claimant_org_id = $1 AND c.status = $2 ORDER BY c.updated_at DESC LIMIT 15',
          [orgId, 'ACCEPTED'],
        )
        for (const r of accepted.rows) {
          items.push({
            id: 'claim-' + r.id,
            title: 'Claim accepted — ready to pick up',
            message: r.listing_title ?? 'Your claim was accepted',
            href: role === 'NGO' ? '/ngo/claims' : '/animal/claims',
            createdAt: new Date(r.updated_at).toISOString(),
            kind: 'action',
          })
        }
      }
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return { items, unreadCount: items.length }
  },
)
