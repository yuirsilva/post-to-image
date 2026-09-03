import 'dotenv/config'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import { mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'

interface InstagramUser {
  username?: string
  full_name?: string
  profile_pic_url_hd?: string
  profile_pic_url?: string
  is_verified?: boolean
}

interface InstagramNode {
  [key: string]: unknown
  shortcode?: string
  code?: string
  items?: InstagramNode[]
  owner?: InstagramUser
  user?: InstagramUser
  carousel_media?: InstagramNode[]
  display_url?: string
  image_versions2?: { candidates?: Array<{ url?: string }> }
  is_video?: boolean
  media_type?: number
  video_versions?: Array<{ url?: string }>
  video_url?: string
  video_duration?: number
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> }
  caption?: { text?: string }
  taken_at_timestamp?: number
  taken_at?: number
  location?: { name?: string }
  edge_media_preview_like?: { count?: number }
  edge_liked_by?: { count?: number }
  like_count?: number
  edge_media_to_comment?: { count?: number }
  comment_count?: number
  media_repost_count?: number
  repost_count?: number
  reshare_count?: number
  share_count?: number
}

interface ServerPost {
  platform: 'instagram' | 'x'
  postId?: string
  shortcode?: string
  username: string
  name: string
  avatar: string
  image: string
  mediaType: 'image' | 'video'
  videoDuration: number
  videoUrl: string
  location: string
  caption: string
  likes: string
  comments: string
  reposts: string
  bookmarks: string
  views: string
  date: string
  createdAt?: string
  verified: boolean
  quotedPost?: XQuotedPost
  parentPost?: XQuotedPost
}

interface XQuotedPost {
  postId?: string
  username: string
  name: string
  avatar: string
  image: string
  mediaType: 'image' | 'video'
  caption: string
  date: string
  createdAt?: string
  verified: boolean
}

interface VideoExportBody {
  frameDataUrl?: unknown
  mediaRect?: Partial<
    Record<'x' | 'y' | 'width' | 'height' | 'borderRadius', unknown>
  >
  outputSize?: Partial<Record<'width' | 'height', unknown>>
  url?: unknown
}

interface XUrlEntity {
  url?: string
  display_url?: string
  expanded_url?: string
}

interface XEmbedResponse {
  id_str?: string
  favorite_count?: number
  conversation_count?: number
  retweet_count?: number
  created_at?: string
  in_reply_to_status_id_str?: string
  text?: string
  entities?: { urls?: XUrlEntity[] }
  mediaDetails?: XGraphqlMedia[]
  photos?: Array<{ url?: string }>
  user?: XEmbedUser
  quoted_tweet?: XEmbedQuotedTweet
}

interface XEmbedUser {
  name?: string
  screen_name?: string
  profile_image_url_https?: string
  verified?: boolean
  is_blue_verified?: boolean
  verified_type?: string
}

interface XEmbedQuotedTweet {
  id_str?: string
  text?: string
  created_at?: string
  entities?: { urls?: XUrlEntity[] }
  mediaDetails?: XGraphqlMedia[]
  photos?: Array<{ url?: string }>
  user?: XEmbedUser
}

interface XGraphqlMedia {
  media_url_https?: string
  type?: string
  video_info?: {
    duration_millis?: number
    variants?: Array<{
      bitrate?: number
      content_type?: string
      url?: string
    }>
  }
}

interface XGraphqlTweet {
  __typename?: string
  rest_id?: string
  tweet?: XGraphqlTweet
  quoted_status_result?: { result?: XGraphqlTweet }
  core?: {
    user_results?: {
      result?: {
        avatar?: { image_url?: string }
        core?: { name?: string; screen_name?: string }
        is_blue_verified?: boolean
        legacy?: {
          name?: string
          profile_image_url_https?: string
          screen_name?: string
          verified?: boolean
        }
        verification?: { verified_type?: string }
      }
    }
  }
  legacy?: {
    bookmark_count?: number
    created_at?: string
    entities?: { urls?: XUrlEntity[] }
    extended_entities?: { media?: XGraphqlMedia[] }
    favorite_count?: number
    full_text?: string
    reply_count?: number
    retweet_count?: number
  }
  views?: { count?: string }
}

interface XClientConfig {
  bearerToken: string
  featureNames: string[]
  queryId: string
}

const app = express()
const port = Number(process.env.PORT || 5173)
const root = process.cwd()

app.disable('x-powered-by')
app.use(express.json({ limit: '20mb' }))

const instagramHeaders = (): Record<string, string> => {
  const cookie = process.env.INSTAGRAM_COOKIE || ''
  const csrfToken = cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] || ''
  return {
    accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    cookie,
    referer: 'https://www.instagram.com/',
    'user-agent':
      process.env.INSTAGRAM_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    'x-asbd-id': '129477',
    'x-csrftoken': csrfToken,
    'x-ig-app-id': '936619743392459',
    'x-ig-www-claim': '0',
    'x-requested-with': 'XMLHttpRequest',
  }
}

function xHeaders(includeCookie = false): Record<string, string> {
  const cookie = includeCookie ? process.env.X_COOKIE || '' : ''
  return {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    ...(cookie ? { cookie } : {}),
    referer: 'https://x.com/',
    'user-agent':
      process.env.X_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  }
}

function parseInstagramUrl(value: string) {
  const url = new URL(value)
  if (!/(^|\.)instagram\.com$/i.test(url.hostname))
    throw new Error('Not an Instagram URL')
  const match = url.pathname.match(/^\/(?:p|reel|reels)\/([\w-]+)/i)
  if (!match) throw new Error('Not an Instagram post URL')
  return match[1]
}

function parseXUrl(value: string) {
  const url = new URL(value)
  if (!/(^|\.)(x|twitter)\.com$/i.test(url.hostname))
    throw new Error('Not an X URL')
  const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/i)
  if (!match) throw new Error('Not an X post URL')
  return { username: match[1], postId: match[2] }
}

function shortcodeToMediaId(shortcode: string) {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let mediaId = 0n
  for (const character of shortcode) {
    const value = alphabet.indexOf(character)
    if (value < 0) throw new Error('The Instagram shortcode is invalid')
    mediaId = mediaId * 64n + BigInt(value)
  }
  return mediaId.toString()
}

function walkForMedia(
  value: unknown,
  shortcode: string,
  seen = new Set<object>(),
): InstagramNode | null {
  if (!value || typeof value !== 'object' || seen.has(value)) return null
  seen.add(value)
  const record = value as InstagramNode
  if (record.shortcode === shortcode || record.code === shortcode) return record
  if (Array.isArray(record.items) && record.items[0]) return record.items[0]
  for (const child of Object.values(record)) {
    const match = walkForMedia(child, shortcode, seen)
    if (match) return match
  }
  return null
}

function decodeHtml(value = ''): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function meta(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`,
      'i',
    ),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return decodeHtml(match[1])
  }
  return ''
}

function decodeJavaScriptString(value = ''): string {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value.replaceAll('\\/', '/').replaceAll('\\"', '"')
  }
}

function firstMatch(html: string, pattern: RegExp): string {
  return decodeJavaScriptString(html.match(pattern)?.[1] || '')
}

function expandXCaption(
  text: string,
  urls: XUrlEntity[] = [],
  hasMedia = false,
  quotedPostId = '',
): string {
  const expanded = urls.reduce((caption, entity) => {
    if (!entity.url) return caption
    const isQuotedPostUrl = Boolean(
      quotedPostId &&
      entity.expanded_url?.match(
        new RegExp(`/status/${quotedPostId}(?:[/?#]|$)`, 'i'),
      ),
    )
    return caption.replaceAll(
      entity.url,
      isQuotedPostUrl
        ? ''
        : entity.display_url || entity.expanded_url || entity.url,
    )
  }, text)

  return (
    hasMedia
      ? expanded.replace(/\s+https?:\/\/t\.co\/[A-Za-z0-9_]+\s*$/, '')
      : expanded
  ).trim()
}

function xCreatedAt(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function normalizeXEmbedQuote(
  quote: XEmbedQuotedTweet | XEmbedResponse | undefined,
): XQuotedPost | undefined {
  if (!quote?.user) return undefined
  const media = quote.mediaDetails?.[0]
  const image = media?.media_url_https || quote.photos?.[0]?.url || ''

  return {
    postId: quote.id_str,
    username: quote.user.screen_name || '',
    name: quote.user.name || quote.user.screen_name || '',
    avatar: (quote.user.profile_image_url_https || '').replace(
      '_normal.',
      '_400x400.',
    ),
    image,
    mediaType:
      media?.type === 'video' || media?.type === 'animated_gif'
        ? 'video'
        : 'image',
    caption: expandXCaption(
      decodeHtml(quote.text || ''),
      quote.entities?.urls,
      Boolean(image),
    ),
    date: '',
    createdAt: xCreatedAt(quote.created_at),
    verified: Boolean(
      quote.user.verified ||
      quote.user.is_blue_verified ||
      quote.user.verified_type,
    ),
  }
}

function xSyndicationToken(postId: string): string {
  return ((Number(postId) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '')
}

async function loadXSyndicationPost(
  postId: string,
): Promise<XEmbedResponse | undefined> {
  const response = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${postId}&lang=en&token=${xSyndicationToken(postId)}`,
    { headers: xHeaders(), redirect: 'follow' },
  )
  if (!response.ok) return undefined
  return (await response.json()) as XEmbedResponse
}

async function enrichXPostFromSyndication(
  post: ServerPost,
  postId: string,
): Promise<void> {
  try {
    const embed = await loadXSyndicationPost(postId)
    if (!embed) return

    post.likes = String(embed.favorite_count ?? post.likes)
    post.comments = String(embed.conversation_count ?? post.comments)
    post.reposts = String(embed.retweet_count ?? post.reposts)
    const quotedPost = normalizeXEmbedQuote(embed.quoted_tweet)
    post.caption = expandXCaption(
      embed.text ? decodeHtml(embed.text) : post.caption,
      embed.entities?.urls,
      Boolean(post.image),
      quotedPost?.postId,
    )
    post.quotedPost = quotedPost

    if (embed.in_reply_to_status_id_str) {
      const parent = await loadXSyndicationPost(embed.in_reply_to_status_id_str)
      post.parentPost = normalizeXEmbedQuote(parent)
    }
  } catch {
    // The post page remains the source of truth if enrichment is unavailable.
  }
}

function xViewCount(html: string, postId: string): string {
  const tweetKey = Buffer.from(`Tweet:${postId}`).toString('base64')
  const recordStart = html.indexOf(`"client:${tweetKey}:views"`)
  if (recordStart < 0) return ''

  const record = html.slice(recordStart, recordStart + 500)
  const match = record.match(
    /__typename:"ViewCountInfo",count:(?:"((?:\\.|[^"\\])*)"|null)/,
  )
  return match?.[1] === undefined ? '' : decodeJavaScriptString(match[1])
}

function isXPostMediaUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      /(^|\.)pbs\.twimg\.com$/i.test(url.hostname) &&
      /^\/(?:media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//i.test(
        url.pathname,
      )
    )
  } catch {
    return false
  }
}

function isXLoginWall(html: string): boolean {
  return /Age-restricted adult content|To view this media, you(?:'|&#39;|’)ll need to log in to X|This content might not be appropriate for people under 18/i.test(
    html,
  )
}

async function xClientConfig(html: string): Promise<XClientConfig> {
  const mainScript = Array.from(
    html.matchAll(/<script[^>]+src=["']([^"']+\/main\.[^"']+\.js)["']/gi),
    (match) => decodeHtml(match[1]),
  ).at(-1)
  if (!mainScript)
    throw new Error('X did not provide its authenticated client.')

  const response = await fetch(mainScript, {
    headers: xHeaders(),
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`X client returned ${response.status}.`)
  const javascript = await response.text()
  const operationAt = javascript.indexOf('operationName:"TweetResultByRestId"')
  if (operationAt < 0)
    throw new Error('X did not provide its post lookup operation.')
  const operationStart = javascript.lastIndexOf('queryId:"', operationAt)
  const operation = javascript.slice(operationStart, operationAt + 16000)
  const queryId = operation.match(/queryId:"([^"]+)"/)?.[1] || ''
  const featureList = operation.match(/featureSwitches:\[([^\]]*)\]/)?.[1] || ''
  const featureNames = Array.from(
    featureList.matchAll(/"([^"]+)"/g),
    (match) => match[1],
  )
  const encodedBearer = javascript.match(/"Bearer ([^"]+)"/)?.[1] || ''
  const bearerToken = decodeURIComponent(encodedBearer)
  if (!queryId || !bearerToken || !featureNames.length)
    throw new Error('X returned incomplete authenticated client settings.')
  return { bearerToken, featureNames, queryId }
}

function normalizeXGraphql(
  result: XGraphqlTweet,
  postId: string,
  urlUsername: string,
): ServerPost {
  const tweet = result.tweet || result
  const legacy = tweet.legacy
  const user = tweet.core?.user_results?.result
  const userCore = user?.core || user?.legacy
  if (!legacy || !userCore)
    throw new Error('X did not return the requested post.')

  const media = legacy.extended_entities?.media?.[0]
  const videoVariants = (media?.video_info?.variants || []).filter(
    (variant) => variant.content_type === 'video/mp4' && variant.url,
  )
  const videoUrl =
    videoVariants.sort(
      (left, right) => (right.bitrate || 0) - (left.bitrate || 0),
    )[0]?.url || ''
  const image = media?.media_url_https || ''
  const hasMedia = Boolean(image)
  const createdAt = xCreatedAt(legacy.created_at)
  const quotedResult = tweet.quoted_status_result?.result
  const quotedPost = normalizeXGraphqlQuote(quotedResult)

  return {
    platform: 'x',
    postId,
    username: userCore.screen_name || urlUsername,
    name: userCore.name || urlUsername,
    avatar: (
      user?.avatar?.image_url ||
      user?.legacy?.profile_image_url_https ||
      ''
    ).replace('_normal.', '_400x400.'),
    image,
    mediaType:
      media?.type === 'video' || media?.type === 'animated_gif'
        ? 'video'
        : 'image',
    videoDuration: Number(media?.video_info?.duration_millis || 0) / 1000,
    videoUrl,
    location: '',
    caption: expandXCaption(
      decodeHtml(legacy.full_text || ''),
      legacy.entities?.urls,
      hasMedia,
      quotedPost?.postId,
    ),
    likes: String(legacy.favorite_count || 0),
    comments: String(legacy.reply_count || 0),
    reposts: String(legacy.retweet_count || 0),
    bookmarks: String(legacy.bookmark_count || 0),
    views: String(tweet.views?.count || ''),
    date: '',
    createdAt,
    verified:
      Boolean(user?.is_blue_verified || user?.legacy?.verified) ||
      Boolean(user?.verification?.verified_type),
    quotedPost,
  }
}

function normalizeXGraphqlQuote(
  result: XGraphqlTweet | undefined,
): XQuotedPost | undefined {
  const tweet = result?.tweet || result
  const legacy = tweet?.legacy
  const user = tweet?.core?.user_results?.result
  const userCore = user?.core || user?.legacy
  if (!tweet || !legacy || !userCore) return undefined

  const media = legacy.extended_entities?.media?.[0]
  const image = media?.media_url_https || ''

  return {
    postId: tweet.rest_id,
    username: userCore.screen_name || '',
    name: userCore.name || userCore.screen_name || '',
    avatar: (
      user?.avatar?.image_url ||
      user?.legacy?.profile_image_url_https ||
      ''
    ).replace('_normal.', '_400x400.'),
    image,
    mediaType:
      media?.type === 'video' || media?.type === 'animated_gif'
        ? 'video'
        : 'image',
    caption: expandXCaption(
      decodeHtml(legacy.full_text || ''),
      legacy.entities?.urls,
      Boolean(image),
    ),
    date: '',
    createdAt: xCreatedAt(legacy.created_at),
    verified:
      Boolean(user?.is_blue_verified || user?.legacy?.verified) ||
      Boolean(user?.verification?.verified_type),
  }
}

async function loadAuthenticatedXPost(
  html: string,
  postId: string,
  username: string,
): Promise<ServerPost> {
  const cookie = process.env.X_COOKIE || ''
  const csrfToken = cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1] || ''
  if (!cookie || !csrfToken)
    throw new Error('X requires a refreshed session cookie for this post.')

  const client = await xClientConfig(html)
  const variables = {
    tweetId: postId,
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
  }
  const features = Object.fromEntries(
    client.featureNames.map((name) => [name, false]),
  )
  const endpoint = new URL(
    `https://x.com/i/api/graphql/${client.queryId}/TweetResultByRestId`,
  )
  endpoint.searchParams.set('variables', JSON.stringify(variables))
  endpoint.searchParams.set('features', JSON.stringify(features))
  const response = await fetch(endpoint, {
    headers: {
      ...xHeaders(true),
      authorization: `Bearer ${client.bearerToken}`,
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'en',
    },
    redirect: 'follow',
  })
  if (response.status === 401 || response.status === 403)
    throw new Error('X requires a refreshed session cookie for this post.')
  if (!response.ok) throw new Error(`X returned ${response.status}.`)
  const payload = (await response.json()) as {
    data?: { tweetResult?: { result?: XGraphqlTweet } }
  }
  const result = payload.data?.tweetResult?.result
  if (!result) throw new Error('X did not return the requested post.')
  return normalizeXGraphql(result, postId, username)
}

function normalizeX(
  html: string,
  postId: string,
  urlUsername: string,
): ServerPost {
  const title = meta(html, 'og:title')
  const titleMatch = title.match(/^(.*?) \(@([^)]*)\) on X$/)
  const userCore = html.match(
    /__typename:"UserCore",name:"((?:\\.|[^"\\])*)",screen_name:"((?:\\.|[^"\\])*)"/,
  )
  const name =
    titleMatch?.[1] || decodeJavaScriptString(userCore?.[1]) || urlUsername
  const username =
    titleMatch?.[2] || decodeJavaScriptString(userCore?.[2]) || urlUsername
  const avatar = firstMatch(
    html,
    /__typename:"UserAvatar",image_url:"((?:\\.|[^"\\])*)"/,
  ).replace('_normal.', '_400x400.')
  const fullText = firstMatch(html, /full_text:"((?:\\.|[^"\\])*)"/)
  const caption = (
    fullText ? decodeHtml(fullText) : meta(html, 'og:description')
  ).trim()
  const imageCandidate = meta(html, 'og:image')
  const image = isXPostMediaUrl(imageCandidate) ? imageCandidate : ''
  const unescapedHtml = html.replaceAll('\\/', '/')
  const videoUrls = Array.from(
    unescapedHtml.matchAll(
      /https:\/\/video\.twimg\.com\/[^"\\\s]+\.mp4(?:\?[^"\\\s]*)?/g,
    ),
    (match) => decodeHtml(match[0].replaceAll('&amp;', '&')),
  )
  const videoUrl =
    videoUrls.sort((left, right) => {
      const leftSize = left.match(/\/(\d+)x(\d+)\//)
      const rightSize = right.match(/\/(\d+)x(\d+)\//)
      return (
        Number(rightSize?.[1] || 0) * Number(rightSize?.[2] || 0) -
        Number(leftSize?.[1] || 0) * Number(leftSize?.[2] || 0)
      )
    })[0] || ''
  const createdAt = Number(firstMatch(html, /created_at_ms:(\d+)/))
  const count = (name: string) =>
    firstMatch(html, new RegExp(`${name}:(\\d+)`)) || '0'

  return {
    platform: 'x',
    postId,
    username,
    name,
    avatar,
    image,
    mediaType: image && videoUrl ? 'video' : 'image',
    videoDuration:
      Number(firstMatch(html, /duration_millis:(\d+)/)) / 1000 || 0,
    videoUrl: image ? videoUrl : '',
    location: '',
    caption,
    likes: count('favorite_count'),
    comments: count('reply_count'),
    reposts: count('retweet_count'),
    bookmarks: count('bookmark_count'),
    views: xViewCount(html, postId),
    date: '',
    createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
    verified:
      /is_blue_verified:!0/.test(html) ||
      /verified_type:"(?:Business|Government)"/.test(html),
  }
}

async function loadXPost(url: string): Promise<ServerPost> {
  const { postId, username } = parseXUrl(url)
  const canonicalUrl = `https://x.com/${encodeURIComponent(username)}/status/${postId}`
  let upstream = await fetch(canonicalUrl, {
    headers: xHeaders(),
    redirect: 'follow',
  })
  let html = await upstream.text()
  const requiresAuthentication =
    !upstream.ok || !meta(html, 'og:image') || isXLoginWall(html)
  if (requiresAuthentication && !process.env.X_COOKIE)
    throw new Error('X requires a session cookie for this post.')
  if (requiresAuthentication) {
    upstream = await fetch(canonicalUrl, {
      headers: xHeaders(true),
      redirect: 'follow',
    })
    html = await upstream.text()
    if (!upstream.ok) throw new Error(`X returned ${upstream.status}.`)
    if (/\/i\/flow\/login/i.test(upstream.url))
      throw new Error('X requires a refreshed session cookie for this post.')
    const post = await loadAuthenticatedXPost(html, postId, username)
    await enrichXPostFromSyndication(post, postId)
    return post
  }
  if (!upstream.ok) throw new Error(`X returned ${upstream.status}.`)
  if (/\/i\/flow\/login/i.test(upstream.url))
    throw new Error('X requires a refreshed session cookie for this post.')
  const post = normalizeX(html, postId, username)

  // X's embed payload carries reply context and engagement values omitted from
  // the server-rendered page. It remains optional so core post loading is safe.
  await enrichXPostFromSyndication(post, postId)

  return post
}

function normalize(
  node: InstagramNode | null,
  html: string,
  shortcode: string,
): ServerPost {
  const user = node?.owner || node?.user || {}
  const primaryMedia = node?.carousel_media?.[0] || node
  const image =
    primaryMedia?.display_url ||
    primaryMedia?.image_versions2?.candidates?.[0]?.url ||
    meta(html, 'og:image')
  const isVideo = Boolean(
    primaryMedia?.is_video ||
    primaryMedia?.media_type === 2 ||
    primaryMedia?.video_versions?.length ||
    primaryMedia?.video_url ||
    meta(html, 'og:video'),
  )
  const videoUrl =
    primaryMedia?.video_versions?.[0]?.url || primaryMedia?.video_url || ''
  const caption =
    node?.edge_media_to_caption?.edges?.[0]?.node?.text ||
    node?.caption?.text ||
    meta(html, 'og:description')
      .replace(/^.*? on Instagram:\s*[“"]?/, '')
      .replace(/[”"]$/, '')
  const username =
    user.username ||
    meta(html, 'og:title').match(/@([\w.]+)/)?.[1] ||
    'instagram'
  const timestamp = node?.taken_at_timestamp || node?.taken_at

  if (!image) throw new Error('Instagram did not return an image for this post')

  return {
    platform: 'instagram',
    shortcode,
    username,
    name: user.full_name || username,
    avatar: user.profile_pic_url_hd || user.profile_pic_url || '',
    image,
    mediaType: isVideo ? 'video' : 'image',
    videoDuration: isVideo ? Number(primaryMedia?.video_duration || 0) : 0,
    videoUrl,
    location: node?.location?.name || '',
    caption: caption || '',
    likes: String(
      node?.edge_media_preview_like?.count ||
        node?.edge_liked_by?.count ||
        node?.like_count ||
        0,
    ),
    comments: String(
      node?.edge_media_to_comment?.count ?? node?.comment_count ?? 0,
    ),
    reposts: String(
      node?.media_repost_count ??
        node?.repost_count ??
        node?.reshare_count ??
        node?.share_count ??
        0,
    ),
    bookmarks: '0',
    views: '0',
    date: timestamp
      ? new Date(timestamp * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    verified: Boolean(user.is_verified),
  }
}

async function getVideoSource(shortcode: string): Promise<string> {
  const mediaId = shortcodeToMediaId(shortcode)
  const upstream = await fetch(
    `https://www.instagram.com/api/v1/media/${mediaId}/info/`,
    {
      headers: instagramHeaders(),
      redirect: 'follow',
    },
  )

  if (upstream.status === 401 || upstream.status === 403) {
    throw new Error(
      'The Instagram session expired. Replace INSTAGRAM_COOKIE and try again.',
    )
  }
  if (!upstream.ok) throw new Error(`Instagram returned ${upstream.status}.`)

  const parsed: unknown = await upstream.json()
  const node = walkForMedia(parsed, shortcode)
  const primaryMedia = node?.carousel_media?.[0] || node
  const videoUrl =
    primaryMedia?.video_versions?.[0]?.url || primaryMedia?.video_url
  if (!videoUrl)
    throw new Error('Instagram did not return a video stream for this post.')
  return videoUrl
}

function runFfmpeg(argumentsList: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', argumentsList, { windowsHide: true })
    let errorOutput = ''

    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      errorOutput += chunk.toString()
      if (errorOutput.length > 12000) errorOutput = errorOutput.slice(-12000)
    })
    ffmpeg.on('error', reject)
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve()
      else {
        console.error(errorOutput)
        reject(new Error('Video encoding failed.'))
      }
    })
  })
}

function openDefaultBrowser(url: string): void {
  const [command, argumentsList] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
  const browser = spawn(command, argumentsList, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })

  browser.on('error', (error) => {
    console.warn(`Could not open the default browser: ${error.message}`)
  })
  browser.unref()
}

async function asDataUrl(
  url: string,
  headers: Record<string, string> = instagramHeaders(),
): Promise<string> {
  if (!url) return ''
  const response = await fetch(url, {
    headers,
    redirect: 'follow',
  })
  if (!response.ok) return url
  const type = response.headers.get('content-type') || 'image/jpeg'
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 15 * 1024 * 1024)
    throw new Error('Instagram image is too large')
  return `data:${type};base64,${bytes.toString('base64')}`
}

app.get('/api/instagram', async (request, response) => {
  try {
    if (!process.env.INSTAGRAM_COOKIE) {
      return response
        .status(503)
        .json({ error: 'Instagram session cookie is not configured.' })
    }

    const shortcode = parseInstagramUrl(String(request.query.url || ''))
    const postUrl = `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/`
    const jsonUrl = `${postUrl}?__a=1&__d=dis`
    const mediaId = shortcodeToMediaId(shortcode)
    const mediaInfoUrl = `https://www.instagram.com/api/v1/media/${mediaId}/info/`
    let upstream = await fetch(mediaInfoUrl, {
      headers: instagramHeaders(),
      redirect: 'follow',
    })
    let body = await upstream.text()

    if (!upstream.ok) {
      upstream = await fetch(jsonUrl, {
        headers: instagramHeaders(),
        redirect: 'follow',
      })
      body = await upstream.text()
    }

    // Instagram frequently disables the legacy web JSON response per session.
    // The authenticated canonical page still contains the post's server-rendered metadata.
    if (!upstream.ok) {
      const pageHeaders = instagramHeaders()
      pageHeaders.accept =
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      delete pageHeaders['x-requested-with']
      upstream = await fetch(postUrl, {
        headers: pageHeaders,
        redirect: 'follow',
      })
      body = await upstream.text()
    }

    if (
      upstream.status === 401 ||
      upstream.status === 403 ||
      /login/i.test(upstream.url)
    ) {
      return response.status(401).json({
        error:
          'The Instagram session expired. Replace INSTAGRAM_COOKIE and try again.',
      })
    }
    if (!upstream.ok) {
      return response
        .status(502)
        .json({ error: `Instagram returned ${upstream.status}.` })
    }

    let parsed: unknown = null
    try {
      parsed = JSON.parse(body) as unknown
    } catch {
      /* Instagram may return HTML */
    }
    const node = parsed ? walkForMedia(parsed, shortcode) : null
    const post = normalize(node, parsed ? '' : body, shortcode)
    const [image, avatar] = await Promise.all([
      asDataUrl(post.image),
      asDataUrl(post.avatar),
    ])
    const { videoUrl: _videoUrl, ...publicPost } = post
    response.json({ ...publicPost, image, avatar })
  } catch (error) {
    response.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : 'Could not load this Instagram post.',
    })
  }
})

app.get('/api/x', async (request, response) => {
  try {
    const post = await loadXPost(String(request.query.url || ''))
    const headers = xHeaders()
    const [
      image,
      avatar,
      quotedImage,
      quotedAvatar,
      parentImage,
      parentAvatar,
    ] = await Promise.all([
      asDataUrl(post.image, headers),
      asDataUrl(post.avatar, headers),
      asDataUrl(post.quotedPost?.image || '', headers),
      asDataUrl(post.quotedPost?.avatar || '', headers),
      asDataUrl(post.parentPost?.image || '', headers),
      asDataUrl(post.parentPost?.avatar || '', headers),
    ])
    const { videoUrl: _videoUrl, ...publicPost } = post
    response.json({
      ...publicPost,
      image,
      avatar,
      quotedPost: post.quotedPost
        ? { ...post.quotedPost, image: quotedImage, avatar: quotedAvatar }
        : undefined,
      parentPost: post.parentPost
        ? { ...post.parentPost, image: parentImage, avatar: parentAvatar }
        : undefined,
    })
  } catch (error) {
    response.status(400).json({
      error:
        error instanceof Error ? error.message : 'Could not load this X post.',
    })
  }
})

app.post('/api/video-export', async (request, response) => {
  let directory = ''
  let framePath = ''
  let sourcePath = ''
  let outputPath = ''

  try {
    const { frameDataUrl, mediaRect, outputSize, url } = (request.body ||
      {}) as VideoExportBody
    const sourceUrl = String(url || '')
    const isX = /(^|\.)(x|twitter)\.com$/i.test(new URL(sourceUrl).hostname)
    if (!isX && !process.env.INSTAGRAM_COOKIE) {
      return response
        .status(503)
        .json({ error: 'Instagram session cookie is not configured.' })
    }
    const identifier = isX
      ? parseXUrl(sourceUrl).postId
      : parseInstagramUrl(sourceUrl)
    if (!/^data:image\/png;base64,/.test(String(frameDataUrl || ''))) {
      throw new Error('The video frame is invalid.')
    }

    const values = [
      mediaRect?.x,
      mediaRect?.y,
      mediaRect?.width,
      mediaRect?.height,
      mediaRect?.borderRadius,
      outputSize?.width,
      outputSize?.height,
    ].map(Number)
    if (
      values.some(
        (value) => !Number.isInteger(value) || value < 0 || value > 6000,
      )
    ) {
      throw new Error('The video layout dimensions are invalid.')
    }
    const [
      mediaX,
      mediaY,
      mediaWidth,
      mediaHeight,
      requestedRadius,
      outputWidth,
      outputHeight,
    ] = values
    if (!mediaWidth || !mediaHeight || !outputWidth || !outputHeight) {
      throw new Error('The video layout dimensions are incomplete.')
    }
    const mediaRadius = Math.min(
      requestedRadius,
      Math.floor(mediaWidth / 2),
      Math.floor(mediaHeight / 2),
    )

    const frame = String(frameDataUrl)
    const frameBytes = Buffer.from(
      frame.slice(frame.indexOf(',') + 1),
      'base64',
    )
    if (!frameBytes.length || frameBytes.length > 15 * 1024 * 1024) {
      throw new Error('The video frame is too large.')
    }

    const xPost = isX ? await loadXPost(sourceUrl) : null
    const videoUrl = isX
      ? xPost?.videoUrl || ''
      : await getVideoSource(identifier)
    if (!videoUrl)
      throw new Error('X did not return a video stream for this post.')
    const videoResponse = await fetch(videoUrl, {
      headers: isX ? xHeaders() : instagramHeaders(),
      redirect: 'follow',
    })
    if (!videoResponse.ok)
      throw new Error(
        `${isX ? 'X' : 'Instagram'} video returned ${videoResponse.status}.`,
      )
    const videoBytes = Buffer.from(await videoResponse.arrayBuffer())
    if (!videoBytes.length || videoBytes.length > 150 * 1024 * 1024) {
      throw new Error(
        `The ${isX ? 'X' : 'Instagram'} video is too large to export.`,
      )
    }

    directory = await mkdtemp(path.join(tmpdir(), 'postcard-video-'))
    framePath = path.join(directory, 'frame.png')
    sourcePath = path.join(directory, 'source.mp4')
    outputPath = path.join(directory, 'post.mp4')
    await Promise.all([
      writeFile(framePath, frameBytes),
      writeFile(sourcePath, videoBytes),
    ])

    const filter = [
      `[1:v]scale=${mediaWidth}:${mediaHeight},setsar=1,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(pow(max(abs(X-W/2)-(W/2-${mediaRadius}),0),2)+pow(max(abs(Y-H/2)-(H/2-${mediaRadius}),0),2),pow(${mediaRadius},2)),0,255)'[rounded]`,
      `[0:v][rounded]overlay=${mediaX}:${mediaY}:shortest=1[composed]`,
    ].join(';')

    await runFfmpeg([
      '-hide_banner',
      '-loglevel',
      'error',
      '-loop',
      '1',
      '-framerate',
      '30',
      '-i',
      framePath,
      '-i',
      sourcePath,
      '-filter_complex',
      filter,
      '-map',
      '[composed]',
      '-map',
      '1:a:0?',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      '-shortest',
      '-y',
      outputPath,
    ])

    const output = await readFile(outputPath)
    response.set({
      'content-disposition': `attachment; filename="${identifier}-${isX ? 'x' : 'instagram'}-post.mp4"`,
      'content-length': String(output.length),
      'content-type': 'video/mp4',
    })
    response.send(output)
  } catch (error) {
    if (!response.headersSent) {
      response.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Could not export this video post.',
      })
    }
  } finally {
    await Promise.allSettled(
      [outputPath, sourcePath, framePath]
        .filter(Boolean)
        .map((file) => unlink(file)),
    )
    if (directory) await rmdir(directory).catch(() => {})
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')))
  app.use(async (_request, response) => {
    response
      .type('html')
      .send(await readFile(path.join(root, 'dist', 'index.html'), 'utf8'))
  })
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
}

app.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`
  console.log(`Postcard is running at ${url}`)
  if (process.env.NODE_ENV !== 'production') openDefaultBrowser(url)
})
