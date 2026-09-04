import { CheckIcon, CopyIcon, CornersOutIcon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import type { RefObject } from 'react'
import type {
  Dimensions,
  ExportQuality,
  ExportTheme,
  MetricName,
  Metrics,
  SocialPostData,
  XAppearance,
} from '../types'
import { AnimatedButtonContent } from './AnimatedButtonContent'
import { EditorControls } from './EditorControls'
import { ExportArtwork } from './ExportArtwork'

export function EditorWorkspace({
  copied,
  downloaded,
  exportRef,
  isDownloading,
  metrics,
  onCopy,
  onDownload,
  onFullscreen,
  onQualityChange,
  onShowCountsChange,
  onThemeChange,
  onToggleMetric,
  onShowParentPostChange,
  outputSize,
  post,
  quality,
  showCounts,
  theme,
  xAppearance,
  onXAppearanceChange,
  onUseOriginalMediaRatioChange,
  showParentPost,
  useOriginalMediaRatio,
}: {
  copied: boolean
  downloaded: boolean
  exportRef: RefObject<HTMLDivElement | null>
  isDownloading: boolean
  metrics: Metrics
  onCopy: () => void
  onDownload: () => void
  onFullscreen: () => void
  onQualityChange: (quality: ExportQuality) => void
  onShowCountsChange: (show: boolean) => void
  onThemeChange: (theme: ExportTheme) => void
  onToggleMetric: (name: MetricName) => void
  onShowParentPostChange: (show: boolean) => void
  outputSize: Dimensions
  post: SocialPostData
  quality: ExportQuality
  showCounts: boolean
  theme: ExportTheme
  xAppearance: XAppearance
  onXAppearanceChange: (appearance: XAppearance) => void
  onUseOriginalMediaRatioChange: (useOriginalRatio: boolean) => void
  showParentPost: boolean
  useOriginalMediaRatio: boolean
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label="Image editor"
      className="max-w-site border-line mx-auto w-full border-t px-4 py-16 sm:px-6 lg:py-20"
      exit={{ opacity: 0, y: 8 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="text-success inline-flex items-center gap-1.5 text-xs font-bold">
            <CheckIcon size={14} weight="bold" /> Post ready
          </span>
          <h2 className="font-display mt-3 text-4xl leading-tight font-bold tracking-tighter sm:text-5xl">
            Make it yours
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="secondary-button pressable min-w-24 justify-center"
            onClick={onCopy}
            type="button"
          >
            <AnimatedButtonContent state={copied ? 'copied' : 'idle'}>
              {copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
              {copied ? 'Copied' : 'Copy URL'}
            </AnimatedButtonContent>
          </button>
          <button
            className="secondary-button pressable"
            onClick={onFullscreen}
            type="button"
          >
            <CornersOutIcon size={17} /> Full-screen preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="checkerboard min-h-editor border-line grid place-items-center overflow-auto rounded-xl border p-6 lg:p-10">
          <ExportArtwork
            ref={exportRef}
            metrics={metrics}
            post={post}
            showCounts={showCounts}
            theme={theme}
            xAppearance={xAppearance}
            useOriginalMediaRatio={useOriginalMediaRatio}
            showParentPost={showParentPost}
          />
        </div>
        <EditorControls
          downloaded={downloaded}
          isDownloading={isDownloading}
          hasParentPost={Boolean(post.parentPost)}
          mediaType={post.mediaType}
          platform={post.platform}
          xAppearance={xAppearance}
          onXAppearanceChange={onXAppearanceChange}
          onUseOriginalMediaRatioChange={onUseOriginalMediaRatioChange}
          metrics={metrics}
          onDownload={onDownload}
          onQualityChange={onQualityChange}
          onShowCountsChange={onShowCountsChange}
          onThemeChange={onThemeChange}
          onToggleMetric={onToggleMetric}
          onShowParentPostChange={onShowParentPostChange}
          outputSize={outputSize}
          quality={quality}
          showCounts={showCounts}
          theme={theme}
          showParentPost={showParentPost}
          useOriginalMediaRatio={useOriginalMediaRatio}
        />
      </div>
    </motion.section>
  )
}
