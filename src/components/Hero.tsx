import {
  ArrowRightIcon,
  LinkSimpleIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react'
import { motion } from 'motion/react'
import type { FormEvent } from 'react'
import type {
  ExportQuality,
  LoadStatus,
  Metrics,
  SocialPostData,
  XAppearance,
} from '../types'
import { AnimatedButtonContent } from './AnimatedButtonContent'
import { InstagramPost } from './InstagramPost'
import { XPost } from './XPost'

const entrance = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

interface HeroProps {
  error: string
  metrics: Metrics
  onCreate: (event: FormEvent<HTMLFormElement>) => void
  onUrlChange: (value: string) => void
  onUseExample: () => void
  post: SocialPostData
  quality: ExportQuality
  showCounts: boolean
  status: LoadStatus
  url: string
  xAppearance: XAppearance
  showParentPost: boolean
  useOriginalMediaRatio: boolean
}

export function Hero({
  error,
  metrics,
  onCreate,
  onUrlChange,
  onUseExample,
  post,
  quality,
  showCounts,
  status,
  url,
  xAppearance,
  showParentPost,
  useOriginalMediaRatio,
}: HeroProps) {
  return (
    <section
      className="min-h-hero max-w-site mx-auto grid w-full grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-16"
      id="top"
    >
      <motion.div
        animate="visible"
        className="max-w-2xl"
        initial="hidden"
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        variants={entrance}
      >
        <p className="text-muted mb-6 flex items-center gap-2.5 text-xs font-semibold">
          <span className="border-line text-ink bg-surface rounded-full border px-2.5 py-1.5">
            Free tool
          </span>
          No sign-up required
        </p>
        <h1 className="font-display mb-6 max-w-3xl text-5xl leading-none font-bold tracking-tighter sm:text-6xl xl:text-7xl">
          Turn a social post into a{' '}
          <em className="text-brand not-italic">beautiful image.</em>
        </h1>
        <p className="text-muted mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
          Paste an Instagram or X link. Keep the complete post context, then
          export a crisp PNG or framed MP4.
        </p>

        <form onSubmit={onCreate} noValidate>
          <label
            className="mb-2.5 block text-xs font-bold"
            htmlFor="instagram-url"
          >
            Instagram or X post URL
          </label>
          <div
            className={`shadow-panel focus-within:border-brand focus-within:ring-brand/10 bg-surface grid grid-cols-[auto_1fr] items-center gap-2.5 rounded-xl border py-2 pr-2 pl-4 transition-shadow focus-within:ring-4 sm:grid-cols-[auto_1fr_auto] ${error ? 'border-danger' : 'border-field'}`}
          >
            <LinkSimpleIcon
              aria-hidden="true"
              className="text-placeholder"
              size={21}
            />
            <input
              autoComplete="url"
              className="text-ink placeholder:text-placeholder h-11 min-w-0 border-0 bg-transparent outline-none"
              id="instagram-url"
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://instagram.com/p/... or x.com/.../status/..."
              type="url"
              value={url}
            />
            <button
              aria-label={
                status === 'loading' ? 'Loading social post' : 'Create image'
              }
              className="pressable bg-ink hover:bg-ink-soft text-on-ink col-span-full inline-flex h-12 w-full items-center justify-center rounded-lg border-0 px-4.5 font-bold transition-colors disabled:cursor-wait disabled:opacity-70 sm:col-span-1 sm:w-40"
              disabled={status === 'loading'}
              type="submit"
            >
              <AnimatedButtonContent
                state={status === 'loading' ? 'loading' : 'idle'}
              >
                {status === 'loading' ? (
                  <>
                    <SpinnerGapIcon className="animate-spin" size={20} />
                    Loading post
                  </>
                ) : (
                  <>
                    Create image <ArrowRightIcon size={19} weight="bold" />
                  </>
                )}
              </AnimatedButtonContent>
            </button>
          </div>
          {error ? (
            <p
              className="text-danger mx-0.5 mt-2.5 text-xs font-semibold"
              role="alert"
            >
              {error}
            </p>
          ) : (
            <p className="text-muted mx-0.5 mt-2.5 text-xs">
              Works with Instagram posts and Reels, plus X image and video
              posts.{' '}
              <button
                className="pressable text-ink border-0 bg-transparent p-0 font-bold underline underline-offset-3"
                onClick={onUseExample}
                type="button"
              >
                Try an example
              </button>
            </p>
          )}
        </form>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        aria-label={`Example converted ${post.platform === 'x' ? 'X' : 'Instagram'} post`}
        className="before:bg-brand relative w-full max-w-md justify-self-center p-4 before:absolute before:inset-y-4 before:-right-4 before:left-4 before:rotate-5 before:rounded-xl lg:justify-self-end lg:p-6"
        initial={{ opacity: 0, scale: 0.985 }}
        transition={{
          delay: 0.06,
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="border-line bg-surface shadow-float absolute top-0 -left-1 z-10 -rotate-5 rounded-lg border px-3 py-2.5 text-xs font-bold lg:-left-6">
          The complete post
        </div>
        <div className="border-line bg-board shadow-card relative -rotate-2 rounded-xl border p-6 sm:p-8">
          {post.platform === 'x' ? (
            <XPost
              appearance={xAppearance}
              metrics={metrics}
              post={post}
              showCounts={showCounts}
              showParentPost={showParentPost}
              useOriginalMediaRatio={useOriginalMediaRatio}
            />
          ) : (
            <InstagramPost
              metrics={metrics}
              post={post}
              showCounts={showCounts}
            />
          )}
        </div>
        <div className="border-line bg-surface shadow-float absolute right-0 bottom-2.5 z-10 rotate-4 rounded-lg border px-3 py-2 text-xs font-bold">
          {post.mediaType === 'video' ? 'MP4' : 'PNG'} · {quality}×
        </div>
      </motion.div>
    </section>
  )
}
