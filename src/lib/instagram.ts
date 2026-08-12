export function formatActionCount(value: string | number | null | undefined) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(parsed)) return '0'
  if (Math.abs(parsed) < 1000) return parsed.toLocaleString('en-US')

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(parsed)
}

export function isInstagramUrl(value: string) {
  try {
    const parsed = new URL(value)
    return (
      /(^|\.)instagram\.com$/i.test(parsed.hostname) &&
      /\/(p|reel|reels)\//i.test(parsed.pathname)
    )
  } catch {
    return false
  }
}

export function getPostPlatform(value: string) {
  try {
    const parsed = new URL(value)
    if (
      /(^|\.)instagram\.com$/i.test(parsed.hostname) &&
      /\/(p|reel|reels)\//i.test(parsed.pathname)
    )
      return 'instagram' as const
    if (
      /(^|\.)(x|twitter)\.com$/i.test(parsed.hostname) &&
      /\/[^/]+\/status\/\d+/i.test(parsed.pathname)
    )
      return 'x' as const
  } catch {
    // Invalid URLs are handled by the caller.
  }
  return null
}
