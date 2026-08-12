import { forwardRef } from 'react'
import type {
  ExportTheme,
  Metrics,
  SocialPostData,
  XAppearance,
} from '../types'
import { InstagramPost } from './InstagramPost'
import { XPost } from './XPost'

interface ExportThemeDefinition {
  label: string
  className: string
}

export const exportThemes: Record<ExportTheme, ExportThemeDefinition> = {
  transparent: { label: 'No background', className: 'bg-transparent' },
  paper: { label: 'Soft gray', className: 'bg-export-paper' },
  ink: { label: 'Black', className: 'bg-black' },
  coral: { label: 'Coral', className: 'bg-export-coral' },
}

interface ExportArtworkProps {
  post: SocialPostData
  theme: ExportTheme
  metrics: Metrics
  xAppearance: XAppearance
}

export const ExportArtwork = forwardRef<HTMLDivElement, ExportArtworkProps>(
  function ExportArtwork({ post, theme, metrics, xAppearance }, ref) {
    const canvasClass =
      theme === 'transparent'
        ? 'w-export-content min-w-export-content p-0'
        : 'w-export-width min-w-export-width p-8'
    const themeClass =
      theme === 'paper' && post.platform === 'x'
        ? 'bg-white'
        : exportThemes[theme].className

    return (
      <div
        ref={ref}
        className={`export-canvas shadow-export [&_.social-post]:w-full ${canvasClass} ${themeClass}`}
      >
        {post.platform === 'x' ? (
          <XPost appearance={xAppearance} metrics={metrics} post={post} />
        ) : (
          <InstagramPost metrics={metrics} post={post} />
        )}
      </div>
    )
  },
)
