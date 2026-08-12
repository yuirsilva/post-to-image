import { PlayIcon } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { formatActionCount } from '../lib/instagram'
import type { MetricName, Metrics, SocialPostData, XAppearance } from '../types'
import {
  XBookmarkIcon,
  XLikeIcon,
  XMoreIcon,
  XReplyIcon,
  XRepostIcon,
  XShareIcon,
  XVerifiedIcon,
} from './XIcons'

const xTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})
const xDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatViews(value: string) {
  const count = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(count) ? count.toLocaleString('en-US') : '0'
}

function XCaption({ text }: { text: string }) {
  return text.split(/(@[A-Za-z0-9_]+)/g).map((part, index) =>
    /^@[A-Za-z0-9_]+$/.test(part) ? (
      <span className="text-[#1d9bf0]" key={index}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

const actions: Array<{
  icon: ComponentType
  metric?: Exclude<MetricName, 'views'>
}> = [
  { icon: XReplyIcon, metric: 'comments' },
  { icon: XRepostIcon, metric: 'reposts' },
  { icon: XLikeIcon, metric: 'likes' },
  { icon: XBookmarkIcon, metric: 'bookmarks' },
  { icon: XShareIcon },
]

export function XPost({
  appearance,
  metrics,
  post,
}: {
  appearance: XAppearance
  metrics: Metrics
  post: SocialPostData
}) {
  const isDark = appearance === 'dark'
  const counts = {
    comments: post.comments,
    likes: post.likes,
    reposts: post.reposts,
    bookmarks: post.bookmarks,
  }
  const createdAt = post.createdAt ? new Date(post.createdAt) : null
  const hasTimestamp = createdAt && !Number.isNaN(createdAt.getTime())

  return (
    <article
      className={`social-post x-post font-x overflow-hidden px-4 pt-3 pb-1 text-[15px] leading-5 ${
        isDark ? 'bg-black text-[#e7e9ea]' : 'bg-white text-black'
      }`}
    >
      <header className="flex items-start gap-2.5">
        <img
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
          crossOrigin="anonymous"
          src={post.avatar}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center">
            <strong className="truncate font-bold">{post.name}</strong>
            {post.verified && <XVerifiedIcon className="ml-0.5" />}
          </div>
          <span
            className={`block truncate ${isDark ? 'text-[#71767b]' : 'text-[#536471]'}`}
          >
            @{post.username}
          </span>
        </div>
        <span className={isDark ? 'text-[#71767b]' : 'text-[#536471]'}>
          <XMoreIcon />
        </span>
      </header>

      <p className="mt-3 mb-3 text-[17px] leading-6 whitespace-pre-wrap">
        <XCaption text={post.caption} />
      </p>

      <div
        className={`relative overflow-hidden rounded-2xl border bg-black ${
          isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'
        }`}
        data-video-media={post.mediaType === 'video' ? '' : undefined}
      >
        <img
          alt={`${post.mediaType === 'video' ? 'Video poster' : 'Post image'} by ${post.username}`}
          className="block h-auto max-h-136 w-full object-cover"
          crossOrigin="anonymous"
          src={post.image}
        />
        {post.mediaType === 'video' && (
          <span
            aria-label="Video"
            className="absolute inset-0 grid place-items-center"
            role="img"
          >
            <span className="grid size-14 place-items-center rounded-full bg-[#1d9bf0] text-white shadow-lg">
              <PlayIcon size={27} weight="fill" />
            </span>
          </span>
        )}
      </div>

      <div
        className={`mt-4 text-[15px] leading-5 ${isDark ? 'text-[#71767b]' : 'text-[#536471]'}`}
      >
        {hasTimestamp ? (
          <time dateTime={post.createdAt}>
            {xTimeFormatter.format(createdAt)} ·{' '}
            {xDateFormatter.format(createdAt)}
          </time>
        ) : (
          <time>{post.date}</time>
        )}
        {metrics.views && post.views && (
          <>
            {' · '}
            <strong className={isDark ? 'text-[#e7e9ea]' : 'text-black'}>
              {formatViews(post.views)}
            </strong>{' '}
            {post.views === '1' ? 'View' : 'Views'}
          </>
        )}
      </div>
      <div
        className={`mt-4 flex h-10 items-center justify-between border-t ${
          isDark
            ? 'border-[#2f3336] text-[#71767b]'
            : 'border-[#eff3f4] text-[#536471]'
        }`}
      >
        {actions.map(({ icon: Icon, metric }, index) => (
          <span
            className="inline-flex min-w-10 items-center gap-1.5"
            key={index}
          >
            <Icon />
            {metric && metrics[metric] && (
              <span className="text-[13px] leading-4">
                {formatActionCount(counts[metric])}
              </span>
            )}
          </span>
        ))}
      </div>
    </article>
  )
}
