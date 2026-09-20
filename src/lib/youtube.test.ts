import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enrichYouTubePreview, youtubeVideoId } from './youtube'
import type { YouTubePreview } from '../types'

test('recognizes video links and rejects unrelated hosts and invalid IDs', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'youtube.com/shorts/dQw4w9WgXcQ',
    'https://m.youtube.com/live/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ])
    assert.equal(youtubeVideoId(url), 'dQw4w9WgXcQ')
  for (const url of [
    'https://youtube.com.example.org/watch?v=dQw4w9WgXcQ',
    'https://example.org/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=invalid',
    'https://youtube.com/@channel',
  ])
    assert.equal(youtubeVideoId(url), undefined)
})

test('embeds exportable thumbnails and only removes the previewed link', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string) =>
    url.includes('/oembed?')
      ? Response.json({ title: 'Music video', author_name: 'Artist' })
      : new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/jpeg' },
        }),
  )
  const post: { caption: string; image: string; linkPreview?: YouTubePreview } =
    {
      caption: 'New video\nhttps://youtu.be/dQw4w9WgXcQ\nhttps://example.org',
      image: '',
    }
  await enrichYouTubePreview(post)
  assert.equal(post.linkPreview?.title, 'Music video')
  assert.equal(post.linkPreview?.image, 'data:image/jpeg;base64,AQID')
  assert.equal(post.caption, 'New video\n\nhttps://example.org')
})

test('unavailable videos preserve captions and native media skips lookup', async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 404 }),
  )
  const caption = 'Video https://youtu.be/dQw4w9WgXcQ'
  const post = { caption, image: '' }
  await enrichYouTubePreview(post)
  assert.deepEqual(post, { caption, image: '' })
  await enrichYouTubePreview({ caption, image: 'native-image.jpg' })
  assert.equal(fetchMock.mock.callCount(), 1)
})
