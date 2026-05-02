// Deterministic time helpers locked to Asia/Kathmandu + en-US so SSR and client
// agree on every formatted date or hour. (Avoids React hydration mismatches
// from the user's browser timezone differing from the Node SSR timezone.)

const FMT_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Kathmandu',
})

const FMT_DATE_SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Kathmandu',
})

const FMT_DATETIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kathmandu',
})

const FMT_FULL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kathmandu',
})

const FMT_TIME = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kathmandu',
})

const FMT_HOUR = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  hour12: false,
  timeZone: 'Asia/Kathmandu',
})

export function todayLabel(): string {
  return FMT_DATE.format(new Date())
}

export function dateShort(input: string | Date): string {
  return FMT_DATE_SHORT.format(typeof input === 'string' ? new Date(input) : input)
}

export function dateTime(input: string | Date): string {
  return FMT_DATETIME.format(typeof input === 'string' ? new Date(input) : input)
}

export function fullDateTime(input: string | Date): string {
  return FMT_FULL.format(typeof input === 'string' ? new Date(input) : input)
}

export function timeOnly(input: string | Date): string {
  return FMT_TIME.format(typeof input === 'string' ? new Date(input) : input)
}

export function istHour(): number {
  return Number(FMT_HOUR.format(new Date()))
}

export function greeting(): string {
  const h = istHour()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
