import { PlayIcon } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { formatActionCount } from '../lib/instagram'
import type {
  MetricName,
  Metrics,
  QuotedPostData,
  SocialPostData,
  XAppearance,
  YouTubePreview,
} from '../types'
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
const xCaptionTokenPattern =
  /((?<![A-Za-z0-9._%+-])@[A-Za-z0-9_]+|(?<![\p{L}\p{M}\p{N}_])#[\p{L}\p{M}\p{N}_]+|(?:https?:\/\/|www\.)[^\s]+|(?<![@A-Za-z0-9._%+-])(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s]*)?)/gu
const xLinkedCaptionToken =
  /^(?:@[A-Za-z0-9_]+|#[\p{L}\p{M}\p{N}_]+|(?:https?:\/\/|www\.)[^\s]+|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s]*)?)$/u

function formatViews(value: string) {
  const count = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(count) ? count.toLocaleString('en-US') : '0'
}

function hasCount(value: string) {
  const count = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(count) && count > 0
}

function XCaption({ text }: { text: string }) {
  return text.split(xCaptionTokenPattern).map((part, index) =>
    xLinkedCaptionToken.test(part) ? (
      <span className="text-[#1d9bf0]" key={index}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function XLinkPreview({
  preview,
  isDark,
}: {
  preview: YouTubePreview
  isDark: boolean
}) {
  const border = isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'
  const muted = isDark ? 'text-[#71767b]' : 'text-[#536471]'
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Watch ${preview.title} on YouTube`}
      className={`my-3 flex min-w-0 overflow-hidden rounded-2xl border text-inherit no-underline ${border}`}
    >
      <span
        className={`relative flex w-32.5 shrink-0 items-center border-r bg-black ${border}`}
      >
        <img
          alt=""
          src={preview.image}
          className="aspect-square w-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center"
        >
          <svg
            viewBox="0 0 60 61"
            aria-hidden="true"
            width={60}
            height={60}
            className="size-15"
          >
            <g>
              <circle
                cx="30"
                cy="30.4219"
                fill="#333333"
                opacity="0.8"
                r="30"
              />
              <path
                d="M22.2275 17.1971V43.6465L43.0304 30.4218L22.2275 17.1971Z"
                fill="white"
              />
            </g>
          </svg>
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-3 text-[15px] leading-5">
        <span className={muted}>youtube.com</span>
        <span className="line-clamp-2 wrap-break-word">{preview.title}</span>
        {preview.description ? (
          <span className={`line-clamp-2 wrap-break-word ${muted}`}>
            {preview.description}
          </span>
        ) : null}
      </span>
    </a>
  )
}

function XQuotedPost({
  isDark,
  post,
}: {
  isDark: boolean
  post: QuotedPostData
}) {
  const createdAt = post.createdAt ? new Date(post.createdAt) : null
  const hasTimestamp = createdAt && !Number.isNaN(createdAt.getTime())
  const mutedText = isDark ? 'text-[#71767b]' : 'text-[#536471]'

  return (
    <section
      aria-label={`Quoted post by ${post.name}`}
      className={`mb-3 overflow-hidden rounded-2xl border ${
        isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'
      }`}
    >
      <div className="px-3 pt-3 pb-3">
        <header className="flex min-w-0 items-center gap-1">
          {post.avatar ? (
            <img
              alt=""
              className="mr-0.5 size-5 shrink-0 rounded-full object-cover"
              crossOrigin="anonymous"
              src={post.avatar}
            />
          ) : null}
          <strong className="min-w-0 truncate font-bold">{post.name}</strong>
          {post.verified ? <XVerifiedIcon className="shrink-0" /> : null}
          <span className={`min-w-0 truncate ${mutedText}`}>
            @{post.username}
          </span>
          {(hasTimestamp || post.date) && (
            <span className={`shrink-0 ${mutedText}`}>
              {' · '}
              {hasTimestamp ? (
                <time dateTime={post.createdAt}>
                  {xDateFormatter.format(createdAt)}
                </time>
              ) : (
                <time>{post.date}</time>
              )}
            </span>
          )}
        </header>
        <p className="mt-1 text-[15px] leading-5 whitespace-pre-wrap">
          <XCaption text={post.caption} />
        </p>
        {post.linkPreview ? (
          <XLinkPreview preview={post.linkPreview} isDark={isDark} />
        ) : null}
      </div>

      {post.image ? (
        <img
          alt={`${post.mediaType === 'video' ? 'Video poster' : 'Post image'} by ${post.username}`}
          className={`block max-h-96 w-full border-t object-cover ${
            isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'
          }`}
          crossOrigin="anonymous"
          src={post.image}
        />
      ) : null}
    </section>
  )
}

function XParentPost({
  isDark,
  post,
}: {
  isDark: boolean
  post: QuotedPostData
}) {
  const createdAt = post.createdAt ? new Date(post.createdAt) : null
  const hasTimestamp = createdAt && !Number.isNaN(createdAt.getTime())
  const mutedText = isDark ? 'text-[#71767b]' : 'text-[#536471]'
  const borderColor = isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'

  return (
    <section
      aria-label={`Parent post by ${post.name}`}
      className="flex gap-2.5"
    >
      <div className="flex w-10 shrink-0 flex-col items-center">
        <img
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
          crossOrigin="anonymous"
          src={post.avatar}
        />
        <span
          aria-hidden="true"
          className={`mt-1.5 w-0.5 flex-1 border-l-2 ${borderColor}`}
        />
      </div>
      <div className="min-w-0 flex-1 pb-3">
        <header className="flex min-w-0 items-center gap-1">
          <strong className="min-w-0 truncate font-bold">{post.name}</strong>
          {post.verified ? <XVerifiedIcon className="shrink-0" /> : null}
          <span className={`min-w-0 truncate ${mutedText}`}>
            @{post.username}
          </span>
          {(hasTimestamp || post.date) && (
            <span className={`shrink-0 ${mutedText}`}>
              {' · '}
              {hasTimestamp ? (
                <time dateTime={post.createdAt}>
                  {xDateFormatter.format(createdAt)}
                </time>
              ) : (
                <time>{post.date}</time>
              )}
            </span>
          )}
        </header>
        <p className="mt-0.5 text-[15px] leading-5 whitespace-pre-wrap">
          <XCaption text={post.caption} />
        </p>
        {post.linkPreview ? (
          <XLinkPreview preview={post.linkPreview} isDark={isDark} />
        ) : null}
        {post.image ? (
          <img
            alt={`${post.mediaType === 'video' ? 'Video poster' : 'Post image'} by ${post.username}`}
            className={`mt-3 block max-h-96 w-full rounded-2xl border object-cover ${borderColor}`}
            crossOrigin="anonymous"
            src={post.image}
          />
        ) : null}
      </div>
    </section>
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
  showCounts = true,
  showParentPost = false,
  useOriginalMediaRatio = true,
}: {
  appearance: XAppearance
  metrics: Metrics
  post: SocialPostData
  showCounts?: boolean
  showParentPost?: boolean
  useOriginalMediaRatio?: boolean
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
      {showParentPost && post.parentPost ? (
        <XParentPost isDark={isDark} post={post.parentPost} />
      ) : null}

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
        {showCounts && (
          <span className={isDark ? 'text-[#71767b]' : 'text-[#536471]'}>
            <XMoreIcon />
          </span>
        )}
      </header>

      <p className="mt-3 mb-3 text-[17px] leading-6 whitespace-pre-wrap">
        <XCaption text={post.caption} />
      </p>

      {post.linkPreview ? (
        <XLinkPreview preview={post.linkPreview} isDark={isDark} />
      ) : null}

      {post.image ? (
        <div
          className={`relative max-w-full overflow-hidden rounded-2xl border bg-black ${
            useOriginalMediaRatio ? 'w-fit' : 'w-full'
          } ${isDark ? 'border-[#2f3336]' : 'border-[#cfd9de]'}`}
          data-video-media={post.mediaType === 'video' ? '' : undefined}
        >
          <img
            alt={`${post.mediaType === 'video' ? 'Video poster' : 'Post image'} by ${post.username}`}
            className={`block h-auto max-h-136 max-w-full ${
              useOriginalMediaRatio
                ? 'w-auto object-contain'
                : 'w-full object-cover'
            }`}
            crossOrigin="anonymous"
            src={post.image}
          />
          {post.mediaType === 'video' ? (
            <span
              aria-label="Video"
              className="absolute inset-0 grid place-items-center"
              role="img"
            >
              <span className="grid size-14 place-items-center rounded-full bg-[#1d9bf0] text-white shadow-lg">
                <PlayIcon size={27} weight="fill" />
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {post.quotedPost ? (
        <XQuotedPost isDark={isDark} post={post.quotedPost} />
      ) : null}

      <div
        className={`mt-4 text-[15px] leading-5 ${showCounts ? '' : 'mb-3'} ${isDark ? 'text-[#71767b]' : 'text-[#536471]'}`}
      >
        {hasTimestamp ? (
          <time dateTime={post.createdAt}>
            {xTimeFormatter.format(createdAt)} ·{' '}
            {xDateFormatter.format(createdAt)}
          </time>
        ) : (
          <time>{post.date}</time>
        )}
        {showCounts && metrics.views && hasCount(post.views) && (
          <>
            {' · '}
            <strong className={isDark ? 'text-[#e7e9ea]' : 'text-black'}>
              {formatViews(post.views)}
            </strong>{' '}
            {post.views === '1' ? 'View' : 'Views'}
          </>
        )}
      </div>
      {showCounts && (
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
              {metric && metrics[metric] && hasCount(counts[metric]) && (
                <span className="text-[13px] leading-4">
                  {formatActionCount(counts[metric])}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
