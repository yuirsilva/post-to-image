import { XIcon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import type {
  Dimensions,
  ExportQuality,
  ExportTheme,
  Metrics,
  SocialPostData,
  XAppearance,
} from '../types'
import { ExportArtwork } from './ExportArtwork'

export function PreviewModal({
  metrics,
  onClose,
  outputSize,
  post,
  quality,
  showCounts,
  theme,
  xAppearance,
  showParentPost,
  useOriginalMediaRatio,
}: {
  metrics: Metrics
  onClose: () => void
  outputSize: Dimensions
  post: SocialPostData
  quality: ExportQuality
  showCounts: boolean
  theme: ExportTheme
  xAppearance: XAppearance
  showParentPost: boolean
  useOriginalMediaRatio: boolean
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-label="Full-screen image preview"
      aria-modal="true"
      className="bg-modal fixed inset-0 z-50 flex flex-col"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="dialog"
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-white/15 px-6 text-white">
        <div className="grid gap-1">
          <strong className="font-display text-base leading-tight font-bold">
            Full-screen preview
          </strong>
          <span className="text-instagram-muted text-xs">
            {outputSize.width} × {outputSize.height} px at {quality}×
          </span>
        </div>
        <button
          aria-label="Close full-screen preview"
          className="pressable grid size-10 place-items-center rounded-lg border border-white/20 bg-white/10 text-white"
          onClick={onClose}
          type="button"
        >
          <XIcon size={23} />
        </button>
      </header>
      <div className="modal-stage checkerboard [&_.export-canvas]:shadow-modal grid min-h-0 flex-1 place-items-center overflow-auto p-6 lg:p-10 [&_.export-canvas]:shrink-0">
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 8 }}
          initial={{ opacity: 0, scale: 0.985, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ExportArtwork
            metrics={metrics}
            post={post}
            showCounts={showCounts}
            theme={theme}
            xAppearance={xAppearance}
            showParentPost={showParentPost}
            useOriginalMediaRatio={useOriginalMediaRatio}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
