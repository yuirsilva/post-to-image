import {
  CheckIcon,
  DownloadSimpleIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react'
import type { PropsWithChildren } from 'react'
import type {
  Dimensions,
  ExportQuality,
  ExportTheme,
  MediaType,
  MetricName,
  Metrics,
  Platform,
  XAppearance,
} from '../types'
import { AnimatedButtonContent } from './AnimatedButtonContent'
import { exportThemes } from './ExportArtwork'

const instagramMetricNames = [
  'likes',
  'comments',
  'reposts',
] satisfies MetricName[]
const xMetricNames = [
  'likes',
  'comments',
  'reposts',
  'bookmarks',
  'views',
] satisfies MetricName[]
const qualityOptions = [1, 2, 3] satisfies ExportQuality[]
const themeEntries = Object.entries(exportThemes) as [
  ExportTheme,
  (typeof exportThemes)[ExportTheme],
][]

function ControlGroup({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="border-line-soft mb-5 border-b pb-5">
      <h3 className="font-display mb-3 text-sm font-bold">{title}</h3>
      {children}
    </section>
  )
}

export function EditorControls({
  downloaded,
  isDownloading,
  mediaType,
  platform,
  xAppearance,
  onXAppearanceChange,
  metrics,
  onDownload,
  onQualityChange,
  onThemeChange,
  onToggleMetric,
  outputSize,
  quality,
  theme,
}: {
  downloaded: boolean
  isDownloading: boolean
  mediaType: MediaType
  platform: Platform
  xAppearance: XAppearance
  onXAppearanceChange: (appearance: XAppearance) => void
  metrics: Metrics
  onDownload: () => void
  onQualityChange: (quality: ExportQuality) => void
  onThemeChange: (theme: ExportTheme) => void
  onToggleMetric: (name: MetricName) => void
  outputSize: Dimensions
  quality: ExportQuality
  theme: ExportTheme
}) {
  const isVideo = mediaType === 'video'
  const metricNames = platform === 'x' ? xMetricNames : instagramMetricNames

  return (
    <aside className="border-line flex flex-col rounded-xl border bg-white p-5 lg:min-h-64">
      {platform === 'x' && (
        <ControlGroup title="X appearance">
          <div
            aria-label="X appearance"
            className="grid grid-cols-2 gap-2"
            role="group"
          >
            {(['light', 'dark'] satisfies XAppearance[]).map((appearance) => (
              <button
                aria-pressed={xAppearance === appearance}
                className={`pressable h-11 rounded-lg border font-bold capitalize ${
                  xAppearance === appearance
                    ? 'border-ink bg-ink text-white'
                    : 'border-line text-muted bg-white'
                }`}
                key={appearance}
                onClick={() => onXAppearanceChange(appearance)}
                type="button"
              >
                {appearance}
              </button>
            ))}
          </div>
        </ControlGroup>
      )}

      <ControlGroup title="Background">
        <div className="flex flex-wrap gap-3">
          {themeEntries.map(([key, item]) => {
            const label =
              key === 'paper' && platform === 'x' ? 'White' : item.label
            return (
              <button
                aria-label={
                  key === 'transparent' ? label : `${label} background`
                }
                aria-pressed={theme === key}
                className={`pressable swatch-${key} border-field relative grid size-12 place-items-center rounded-lg border ${key === 'paper' && platform === 'x' ? 'bg-white' : item.className} ${theme === key ? 'ring-brand ring-2 ring-offset-2' : ''}`}
                key={key}
                onClick={() => onThemeChange(key)}
                title={label}
                type="button"
              >
                {theme === key && (
                  <CheckIcon
                    className={key === 'ink' ? 'text-white' : 'text-ink'}
                    size={18}
                    weight="bold"
                  />
                )}
              </button>
            )
          })}
        </div>
      </ControlGroup>

      <ControlGroup title="Export quality">
        <div
          aria-label="Export quality"
          className="grid grid-cols-3 gap-2"
          role="group"
        >
          {qualityOptions.map((value) => (
            <button
              aria-pressed={quality === value}
              className={`pressable h-10 rounded-lg border font-bold ${quality === value ? 'border-ink bg-ink text-white' : 'border-line text-muted bg-white'}`}
              key={value}
              onClick={() => onQualityChange(value)}
              type="button"
            >
              {value}×
            </button>
          ))}
        </div>
      </ControlGroup>

      <ControlGroup title="Display counts">
        <div className="grid gap-3">
          {metricNames.map((name) => (
            <label
              className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold"
              key={name}
            >
              <span>{name[0].toUpperCase() + name.slice(1)}</span>
              <input
                checked={metrics[name]}
                className="peer sr-only"
                onChange={() => onToggleMetric(name)}
                type="checkbox"
              />
              <span className="bg-toggle after:shadow-toggle peer-checked:bg-brand relative h-5 w-9 rounded-full transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          ))}
        </div>
      </ControlGroup>

      <div className="border-line-soft mt-auto grid gap-1 border-t pt-4">
        <span className="text-muted text-xs">
          {isVideo ? 'MP4 output' : 'PNG output'}
        </span>
        <strong className="text-sm">
          {outputSize.width} × {outputSize.height} px
        </strong>
      </div>
      <button
        aria-label={
          isDownloading
            ? `Preparing ${isVideo ? 'video' : 'image'}`
            : `Download ${quality}× ${isVideo ? 'MP4' : 'PNG'}`
        }
        className="pressable bg-brand hover:bg-brand-hover mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-70"
        disabled={isDownloading}
        onClick={onDownload}
        type="button"
      >
        <AnimatedButtonContent
          state={isDownloading ? 'loading' : downloaded ? 'success' : 'idle'}
        >
          {isDownloading ? (
            <SpinnerGapIcon className="animate-spin" size={20} />
          ) : downloaded ? (
            <CheckIcon size={21} weight="bold" />
          ) : (
            <DownloadSimpleIcon size={21} weight="bold" />
          )}
          {isDownloading
            ? isVideo
              ? 'Encoding video'
              : 'Preparing image'
            : downloaded
              ? `${isVideo ? 'MP4' : 'PNG'} downloaded`
              : `Download ${quality}× ${isVideo ? 'MP4' : 'PNG'}`}
        </AnimatedButtonContent>
      </button>
      <p className="text-placeholder mt-3 text-center text-xs">
        {platform === 'instagram'
          ? 'Your Instagram cookie never leaves the server.'
          : 'X post data is fetched securely by the server.'}
      </p>
    </aside>
  )
}
