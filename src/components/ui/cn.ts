export function cn(...inputs: Array<unknown>): string {
  const out: string[] = []
  for (const v of inputs) {
    if (!v) continue
    if (typeof v === 'string') out.push(v)
    else if (typeof v === 'number') out.push(String(v))
  }
  return out.join(' ')
}
