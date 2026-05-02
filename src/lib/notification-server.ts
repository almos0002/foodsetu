/**
 * Notification service — placeholder for SMS / WhatsApp.
 *
 * No real provider (Twilio, Vonage, MSG91, …) is wired up yet. Every
 * "send" call writes a row into `sms_logs` and prints to the server
 * console so you can see what *would* have gone out. Swap the
 * `dispatch*` internals for a real client call when you're ready and the
 * rest of the app keeps working unchanged.
 *
 * Channel:
 *   The `sms_logs` table doesn't carry a dedicated channel column today,
 *   so the channel is encoded as a `[SMS]` / `[WhatsApp]` prefix on the
 *   message body. Easy to grep, easy to migrate to a real column later.
 *
 * Failure isolation:
 *   Every public `notify*` helper (and the underlying `sendSmsPlaceholder`
 *   / `sendWhatsAppPlaceholder` wrappers) catches and logs internal
 *   errors. A logging blip must never break listing creation, claim
 *   acceptance, or OTP issuance — those rows already live in the database
 *   by the time the notifier runs.
 */

import { pool } from './auth'
import { db } from '../db'
import { smsLogs, type NewSmsLog } from '../db/schema'

type SmsPurpose =
  | 'OTP'
  | 'NEW_LISTING_ALERT'
  | 'CLAIM_ACCEPTED'
  | 'PICKUP_REMINDER'
  | 'GENERIC'

type Channel = 'SMS' | 'WHATSAPP'

export type SendOptions = {
  purpose?: SmsPurpose
  relatedListingId?: string | null
  relatedClaimId?: string | null
}

export type SendResult = {
  ok: boolean
  id: string | null
  channel: Channel
  error?: string
}

// ---------------------------------------------------------------------------
// Internal: write one row to sms_logs and "send" via console.log.
// ---------------------------------------------------------------------------

function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const trimmed = phone.trim()
  return trimmed.length === 0 ? null : trimmed
}

function buildBody(channel: Channel, message: string): string {
  const tag = channel === 'WHATSAPP' ? '[WhatsApp]' : '[SMS]'
  return `${tag} ${message}`
}

async function dispatch(
  channel: Channel,
  rawPhone: string,
  message: string,
  opts: SendOptions,
): Promise<SendResult> {
  const phone = sanitizePhone(rawPhone)
  if (!phone) {
    return {
      ok: false,
      id: null,
      channel,
      error: 'Missing recipient phone number',
    }
  }
  if (typeof message !== 'string' || message.length === 0) {
    return {
      ok: false,
      id: null,
      channel,
      error: 'Empty message body',
    }
  }

  const body = buildBody(channel, message)
  const purpose: SmsPurpose = opts.purpose ?? 'GENERIC'

  // For the placeholder the "send" succeeds immediately. Mark the row as
  // SENT (not DELIVERED — we have no carrier confirmation). When a real
  // provider is wired in, set status by the provider response and store
  // its message id in `provider_message_id`.
  const insertValues: NewSmsLog = {
    toPhone: phone,
    body,
    purpose,
    status: 'SENT',
    sentAt: new Date(),
    relatedListingId: opts.relatedListingId ?? null,
    relatedClaimId: opts.relatedClaimId ?? null,
  }

  try {
    const [row] = await db.insert(smsLogs).values(insertValues).returning()
    // Server-side trace so a developer can see what would have shipped.
    // Keep it on a single line for grep-ability.
    console.log(
      `[notify:${channel.toLowerCase()}] to=${phone} purpose=${purpose} ` +
        `id=${row.id} body=${JSON.stringify(message)}`,
    )
    return { ok: true, id: row.id, channel }
  } catch (err) {
    // Swallow logging failures so the caller's main flow still completes.
    console.error('[notify] failed to persist sms_logs row', err)
    return {
      ok: false,
      id: null,
      channel,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ---------------------------------------------------------------------------
// Primitives — exported so callers can send arbitrary one-off messages.
// ---------------------------------------------------------------------------

/**
 * Stand-in for an SMS provider call. Persists the would-be message to
 * `sms_logs` (status=SENT) and logs it to stdout. Never throws — returns
 * `{ok:false}` on any internal error so the caller can branch without
 * wrapping every call in try/catch.
 */
export async function sendSmsPlaceholder(
  phone: string,
  message: string,
  opts: SendOptions = {},
): Promise<SendResult> {
  return dispatch('SMS', phone, message, opts)
}

/**
 * Stand-in for a WhatsApp provider call. Identical semantics to
 * `sendSmsPlaceholder`, but the persisted body is prefixed with
 * `[WhatsApp]` so audit logs can distinguish the channel.
 */
export async function sendWhatsAppPlaceholder(
  phone: string,
  message: string,
  opts: SendOptions = {},
): Promise<SendResult> {
  return dispatch('WHATSAPP', phone, message, opts)
}

/**
 * Convenience: send the same message via both SMS and WhatsApp. Most
 * event helpers below use this so receivers get reached on whichever
 * channel they prefer once a real provider is wired in.
 */
async function sendBothChannels(
  phone: string,
  message: string,
  opts: SendOptions = {},
): Promise<SendResult[]> {
  return Promise.all([
    sendSmsPlaceholder(phone, message, opts),
    sendWhatsAppPlaceholder(phone, message, opts),
  ])
}

// ---------------------------------------------------------------------------
// Helpers for fetching recipient phones from the auth-managed org table.
// ---------------------------------------------------------------------------

type OrgPhoneRow = {
  id: string
  name: string | null
  phone: string | null
}

async function getOrgContact(orgId: string): Promise<OrgPhoneRow | null> {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone FROM "organization" WHERE id = $1 LIMIT 1`,
      [orgId],
    )
    return (rows[0] as OrgPhoneRow | undefined) ?? null
  } catch (err) {
    console.error('[notify] failed to load org contact', orgId, err)
    return null
  }
}

/**
 * Returns verified orgs of the given type that have a phone on file.
 * Used for the "new listing" fan-out so we don't spam unverified or
 * unreachable accounts. Capped at `limit` recipients per event.
 */
async function getVerifiedOrgsByType(
  orgType: 'NGO' | 'ANIMAL_RESCUE',
  excludeOrgId: string | null,
  limit = 100,
): Promise<OrgPhoneRow[]> {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone
         FROM "organization"
        WHERE type = $1
          AND "verificationStatus" = 'VERIFIED'
          AND phone IS NOT NULL
          AND phone <> ''
          AND ($2::text IS NULL OR id <> $2::text)
        LIMIT $3`,
      [orgType, excludeOrgId, limit],
    )
    return rows as OrgPhoneRow[]
  } catch (err) {
    console.error('[notify] failed to load org list', orgType, err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Event helpers — these are the five touchpoints the spec calls out.
// Each one is fire-and-forget and never throws.
// ---------------------------------------------------------------------------

export type ListingForNotification = {
  id: string
  title: string
  quantity: number | string
  quantityUnit: string
  foodCategory: 'HUMAN_SAFE' | 'ANIMAL_SAFE' | string
  pickupStartTime: string | Date
  pickupEndTime: string | Date
  restaurantId: string
}

export type ClaimForNotification = {
  id: string
  foodListingId: string
  claimantOrgId: string
}

function fmtTime(t: string | Date): string {
  const d = t instanceof Date ? t : new Date(t)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Event 1: Food listing created.
 *
 * Fan-outs an alert to every verified org that could realistically claim
 * the listing (NGOs for HUMAN_SAFE, animal rescues for ANIMAL_SAFE) and
 * has a phone on file. The donor restaurant itself is excluded.
 */
export async function notifyFoodListingCreated(
  listing: ListingForNotification,
): Promise<void> {
  try {
    const recipientType: 'NGO' | 'ANIMAL_RESCUE' | null =
      listing.foodCategory === 'HUMAN_SAFE'
        ? 'NGO'
        : listing.foodCategory === 'ANIMAL_SAFE'
          ? 'ANIMAL_RESCUE'
          : null
    if (!recipientType) return

    const recipients = await getVerifiedOrgsByType(
      recipientType,
      listing.restaurantId,
    )
    if (recipients.length === 0) return

    const message =
      `New food available on FoodSetu: "${listing.title}" — ` +
      `${listing.quantity} ${listing.quantityUnit}. ` +
      `Pickup window: ${fmtTime(listing.pickupStartTime)} – ` +
      `${fmtTime(listing.pickupEndTime)}.`

    await Promise.all(
      recipients.map((r) =>
        r.phone
          ? sendBothChannels(r.phone, message, {
              purpose: 'NEW_LISTING_ALERT',
              relatedListingId: listing.id,
            })
          : Promise.resolve([]),
      ),
    )
  } catch (err) {
    console.error('[notify] notifyFoodListingCreated failed', err)
  }
}

/**
 * Event 2: Claim requested.
 *
 * Sent to the donor restaurant so they know to accept or reject.
 */
export async function notifyClaimRequested(
  claim: ClaimForNotification,
  listing: { id: string; title: string; restaurantId: string },
): Promise<void> {
  try {
    const restaurant = await getOrgContact(listing.restaurantId)
    const claimant = await getOrgContact(claim.claimantOrgId)
    if (!restaurant?.phone) return

    const claimantLabel = claimant?.name ?? 'An organization'
    const message =
      `${claimantLabel} requested your listing "${listing.title}" on ` +
      `FoodSetu. Open your dashboard to accept or reject.`

    await sendBothChannels(restaurant.phone, message, {
      purpose: 'GENERIC',
      relatedListingId: listing.id,
      relatedClaimId: claim.id,
    })
  } catch (err) {
    console.error('[notify] notifyClaimRequested failed', err)
  }
}

/**
 * Event 3: Claim accepted.
 *
 * Sent to the claimant org with the donor's contact info so they can
 * coordinate pickup. The OTP itself goes out separately via
 * {@link notifyOtpGenerated} so the two events stay independently
 * auditable in `sms_logs`.
 */
export async function notifyClaimAccepted(
  claim: ClaimForNotification,
  listing: { id: string; title: string; restaurantId: string },
): Promise<void> {
  try {
    const claimant = await getOrgContact(claim.claimantOrgId)
    const restaurant = await getOrgContact(listing.restaurantId)
    if (!claimant?.phone) return

    const restaurantName = restaurant?.name ?? 'The donor'
    const restaurantPhone = restaurant?.phone ?? 'check the app'
    const message =
      `Good news — ${restaurantName} accepted your claim for ` +
      `"${listing.title}". Donor contact: ${restaurantPhone}. ` +
      `An OTP for pickup verification is on its way.`

    await sendBothChannels(claimant.phone, message, {
      purpose: 'CLAIM_ACCEPTED',
      relatedListingId: listing.id,
      relatedClaimId: claim.id,
    })
  } catch (err) {
    console.error('[notify] notifyClaimAccepted failed', err)
  }
}

/**
 * Event 4: OTP generated.
 *
 * Sent to the claimant. Logged with `purpose='OTP'` so the audit trail
 * can be filtered separately. The OTP value lands in `sms_logs.body` —
 * acceptable for the placeholder, but when a real provider goes in,
 * consider redacting the body in `sms_logs` and only sending the OTP to
 * the carrier API.
 */
export async function notifyOtpGenerated(
  claim: ClaimForNotification,
  listing: { id: string; title: string },
  otp: string,
): Promise<void> {
  try {
    const claimant = await getOrgContact(claim.claimantOrgId)
    if (!claimant?.phone) return

    const message =
      `Your FoodSetu pickup OTP for "${listing.title}" is ${otp}. ` +
      `Share this code with the donor at handoff. Do not share it with anyone else.`

    await sendBothChannels(claimant.phone, message, {
      purpose: 'OTP',
      relatedListingId: listing.id,
      relatedClaimId: claim.id,
    })
  } catch (err) {
    console.error('[notify] notifyOtpGenerated failed', err)
  }
}

/**
 * Event 5: Pickup completed.
 *
 * Sent to both parties as a confirmation receipt.
 */
export async function notifyPickupCompleted(
  claim: ClaimForNotification,
  listing: { id: string; title: string; restaurantId: string },
): Promise<void> {
  try {
    const [claimant, restaurant] = await Promise.all([
      getOrgContact(claim.claimantOrgId),
      getOrgContact(listing.restaurantId),
    ])

    const opts: SendOptions = {
      purpose: 'GENERIC',
      relatedListingId: listing.id,
      relatedClaimId: claim.id,
    }

    const tasks: Array<Promise<unknown>> = []

    if (restaurant?.phone) {
      const restaurantMsg =
        `Pickup complete for "${listing.title}". Thanks for donating ` +
        `via FoodSetu — your contribution has been recorded.`
      tasks.push(sendBothChannels(restaurant.phone, restaurantMsg, opts))
    }
    if (claimant?.phone) {
      const claimantMsg =
        `Pickup confirmed for "${listing.title}". Thank you for using ` +
        `FoodSetu — please report any issues from the app within 24 hours.`
      tasks.push(sendBothChannels(claimant.phone, claimantMsg, opts))
    }

    await Promise.all(tasks)
  } catch (err) {
    console.error('[notify] notifyPickupCompleted failed', err)
  }
}
