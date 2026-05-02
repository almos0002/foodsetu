import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_TYPES,
  FOOD_TYPE_LABELS,
  QUANTITY_UNITS,
} from '../lib/permissions'
import type { FoodCategory, FoodType, QuantityUnit } from '../lib/permissions'
import type { ListingInput } from '../lib/listing-server'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'

export type ListingFormInitial = Partial<{
  title: string
  description: string | null
  quantity: number
  quantityUnit: string
  foodCategory: string
  foodType: string
  pickupStartTime: string // ISO
  pickupEndTime: string // ISO
  expiryTime: string // ISO
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
}>

type Props = {
  initial?: ListingFormInitial
  defaultLatitude?: number | null
  defaultLongitude?: number | null
  submitLabel: string
  onSubmit: (data: ListingInput) => Promise<void>
  onCancel?: () => void
}

const inputCls =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-colors focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-canvas-3)]'

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function localInputToIso(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

export function ListingForm({
  initial,
  defaultLatitude,
  defaultLongitude,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [quantity, setQuantity] = useState(
    initial?.quantity != null ? String(initial.quantity) : '',
  )
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>(
    (initial?.quantityUnit as QuantityUnit) ?? 'kg',
  )
  const [foodCategory, setFoodCategory] = useState<FoodCategory>(
    (initial?.foodCategory as FoodCategory) ?? 'HUMAN_SAFE',
  )
  const [foodType, setFoodType] = useState<FoodType>(
    (initial?.foodType as FoodType) ?? 'COOKED',
  )
  const [pickupStart, setPickupStart] = useState(
    isoToLocalInput(initial?.pickupStartTime),
  )
  const [pickupEnd, setPickupEnd] = useState(
    isoToLocalInput(initial?.pickupEndTime),
  )
  const [expiry, setExpiry] = useState(isoToLocalInput(initial?.expiryTime))
  const [latitude, setLatitude] = useState(
    initial?.latitude != null
      ? String(initial.latitude)
      : defaultLatitude != null
        ? String(defaultLatitude)
        : '',
  )
  const [longitude, setLongitude] = useState(
    initial?.longitude != null
      ? String(initial.longitude)
      : defaultLongitude != null
        ? String(defaultLongitude)
        : '',
  )
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!pickupStart || !pickupEnd || !expiry) {
      setError('Pickup start/end time and expiry time are all required')
      return
    }
    if (new Date(pickupEnd) <= new Date(pickupStart)) {
      setError('Pickup end time must be after pickup start time')
      return
    }
    if (new Date(expiry) <= new Date(pickupStart)) {
      setError('Expiry time must be after pickup start time')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        quantity: Number(quantity),
        quantityUnit,
        foodCategory,
        foodType,
        pickupStartTime: localInputToIso(pickupStart),
        pickupEndTime: localInputToIso(pickupEnd),
        expiryTime: localInputToIso(expiry),
        latitude: Number(latitude),
        longitude: Number(longitude),
        imageUrl: imageUrl.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Title" required>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className={inputCls}
          placeholder="e.g. 30 plates of vegetable biryani"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className={inputCls}
          placeholder="Ingredients, allergens, packaging notes…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Quantity" required>
          <input
            required
            type="number"
            step="any"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputCls}
            placeholder="30"
          />
        </Field>
        <Field label="Unit" required>
          <select
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value as QuantityUnit)}
            className={inputCls}
          >
            {QUANTITY_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Food category" required>
          <select
            value={foodCategory}
            onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}
            className={inputCls}
          >
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {FOOD_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Food type" required>
        <select
          value={foodType}
          onChange={(e) => setFoodType(e.target.value as FoodType)}
          className={inputCls}
        >
          {FOOD_TYPES.map((t) => (
            <option key={t} value={t}>
              {FOOD_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Pickup start" required>
          <input
            required
            type="datetime-local"
            value={pickupStart}
            onChange={(e) => setPickupStart(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Pickup end" required>
          <input
            required
            type="datetime-local"
            value={pickupEnd}
            onChange={(e) => setPickupEnd(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Expires at" required>
          <input
            required
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" required>
          <input
            required
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className={inputCls}
            placeholder="12.9716"
          />
        </Field>
        <Field label="Longitude" required>
          <input
            required
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className={inputCls}
            placeholder="77.5946"
          />
        </Field>
      </div>

      <Field label="Image URL">
        <input
          type="url"
          value={imageUrl ?? ''}
          onChange={(e) => setImageUrl(e.target.value)}
          maxLength={2000}
          className={inputCls}
          placeholder="https://…"
        />
      </Field>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--color-danger)]">*</span>
        ) : null}
      </span>
      {children}
    </label>
  )
}
