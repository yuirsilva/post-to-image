import { formatActionCount } from '../lib/instagram'
import { PlayIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { Metrics, SocialPostData } from '../types'
import {
  CommentIcon,
  LikeIcon,
  MoreOptionsIcon,
  RepostIcon,
  SaveIcon,
  ShareIcon,
  VerifiedIcon,
} from './InstagramIcons'

interface ActionProps {
  count?: string
  icon: ReactNode
  visible?: boolean
}

function Action({ count, icon, visible = false }: ActionProps) {
  return (
    <span className="mr-2 inline-flex h-10 items-center gap-1.5">
      {icon}
      {visible && (
        <b className="leading-instagram text-sm font-semibold">
          {formatActionCount(count)}
        </b>
      )}
    </span>
  )
}

interface InstagramPostProps {
  post: SocialPostData
  metrics: Metrics
}

export function InstagramPost({ post, metrics }: InstagramPostProps) {
  return (
    <article className="social-post instagram-post bg-instagram-surface font-instagram leading-instagram text-instagram-text overflow-hidden text-sm">
      <header className="bg-instagram-surface flex h-14 items-center gap-3 px-4 py-3">
        <img
          alt=""
          className="block size-8 shrink-0 rounded-full object-cover"
          crossOrigin="anonymous"
          src={post.avatar}
        />
        <strong className="leading-instagram flex min-w-0 items-center overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
          {post.username}
          {post.verified && <VerifiedIcon className="ml-1" />}
        </strong>
        <span className="ml-auto shrink-0">
          <MoreOptionsIcon />
        </span>
      </header>

      <div
        className="relative"
        data-video-media={post.mediaType === 'video' ? '' : undefined}
      >
        <img
          alt={`${post.mediaType === 'video' ? 'Video poster' : 'Instagram post'} by ${post.username}`}
          className="post-image block h-auto w-full bg-black"
          crossOrigin="anonymous"
          src={post.image}
        />
        {post.mediaType === 'video' && (
          <span
            aria-label="Video"
            className="absolute inset-0 grid place-items-center"
            data-video-indicator
            role="img"
          >
            <span className="grid size-14 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
              <PlayIcon className="-translate-x-px" size={28} weight="fill" />
            </span>
          </span>
        )}
      </div>

      <div className="bg-instagram-surface leading-instagram px-4 pt-1.5 pb-4 text-sm">
        <div className="mb-1.5 flex h-10 items-center" aria-hidden="true">
          <Action
            count={post.likes}
            icon={<LikeIcon />}
            visible={metrics.likes}
          />
          <Action
            count={post.comments}
            icon={<CommentIcon />}
            visible={metrics.comments}
          />
          <Action
            count={post.reposts}
            icon={<RepostIcon />}
            visible={metrics.reposts}
          />
          <Action icon={<ShareIcon />} />
          <span className="ml-auto inline-flex h-10 items-center">
            <SaveIcon />
          </span>
        </div>

        <p className="leading-instagram mb-2 line-clamp-2 overflow-hidden text-sm">
          <strong className="mr-1 font-semibold">{post.username}</strong>
          {post.verified && (
            <VerifiedIcon className="mr-1 mb-0.5 inline-block align-text-bottom" />
          )}
          <span>{post.caption}</span>
        </p>
        <time className="text-instagram-muted block text-xs leading-4">
          {post.date}
        </time>
      </div>
    </article>
  )
}
