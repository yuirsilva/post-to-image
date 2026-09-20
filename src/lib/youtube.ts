import type { YouTubePreview } from '../types'

export function youtubeVideoId(value: string): string | undefined {
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    )
    if (!['http:', 'https:'].includes(url.protocol)) return
    const host = url.hostname.toLowerCase()
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : [
              'youtube.com',
              'www.youtube.com',
              'm.youtube.com',
              'music.youtube.com',
            ].includes(host)
          ? url.pathname === '/watch'
            ? url.searchParams.get('v')
            : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1]
          : undefined
    return id && /^[\w-]{11}$/.test(id) ? id : undefined
  } catch {
    return undefined
  }
}

// Keep optional link enrichment independent from the availability of the post.
export async function enrichYouTubePreview(post: {
  caption: string
  image: string
  linkPreview?: YouTubePreview
}): Promise<void> {
  if (post.image) return
  const links =
    post.caption.match(
      /(?:https?:\/\/|www\.|(?:youtube\.com|youtu\.be)\/)[^\s<>]+/gi,
    ) || []
  for (const token of links) {
    const link = token.replace(/[.,!?;:)\]}]+$/, '')
    const id = youtubeVideoId(link)
    if (!id) continue
    const url = `https://www.youtube.com/watch?v=${id}`
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
        {
          signal: AbortSignal.timeout(5000),
        },
      )
      if (!response.ok) return
      const data = (await response.json()) as {
        title?: unknown
        author_name?: unknown
      }
      if (typeof data.title !== 'string' || !data.title.trim()) return
      const thumbnail = await fetch(
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        {
          signal: AbortSignal.timeout(5000),
        },
      )
      if (
        !thumbnail.ok ||
        !thumbnail.headers.get('content-type')?.startsWith('image/')
      )
        return
      const bytes = Buffer.from(await thumbnail.arrayBuffer())
      if (bytes.length > 5 * 1024 * 1024) return
      post.linkPreview = {
        url,
        title: data.title,
        description:
          typeof data.author_name === 'string' ? data.author_name : '',
        image: `data:${thumbnail.headers.get('content-type')};base64,${bytes.toString('base64')}`,
      }
      post.caption = post.caption.replace(link, '').trim()
    } catch {
      // Preserve the original link when the video is unavailable or times out.
    }
    return
  }
}
