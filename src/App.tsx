import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toPng } from 'html-to-image'
import { AnimatePresence } from 'motion/react'
import { EditorWorkspace } from './components/EditorWorkspace'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { PreviewModal } from './components/PreviewModal'
import { SiteFooter, SiteHeader } from './components/SiteChrome'
import { samplePost } from './data/samplePost'
import { getPostPlatform } from './lib/instagram'
import type {
  ApiError,
  ExportQuality,
  ExportTheme,
  LoadStatus,
  MetricName,
  Metrics,
  SocialPostData,
  XAppearance,
} from './types'

const DEFAULT_METRICS: Metrics = {
  likes: true,
  comments: true,
  reposts: true,
  bookmarks: true,
  views: true,
}

type AppTheme = 'light' | 'dark'

export default function App() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<ExportTheme>('paper')
  const [quality, setQuality] = useState<ExportQuality>(2)
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS)
  const [showCounts, setShowCounts] = useState(true)
  const [xAppearance, setXAppearance] = useState<XAppearance>('light')
  const [useOriginalMediaRatio, setUseOriginalMediaRatio] = useState(true)
  const [showParentPost, setShowParentPost] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [post, setPost] = useState<SocialPostData>(samplePost)
  const [baseSize, setBaseSize] = useState({ width: 540, height: 707 })
  const [appTheme, setAppTheme] = useState<AppTheme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme
    document.documentElement.style.colorScheme = appTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', appTheme === 'dark' ? '#121211' : '#f6f5f2')

    try {
      window.localStorage.setItem('postcard-theme', appTheme)
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }, [appTheme])

  useEffect(() => {
    if (!fullscreen) return undefined

    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === 'Escape' && setFullscreen(false)
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [fullscreen])

  useEffect(() => {
    if (status !== 'ready' || !exportRef.current) return undefined
    const exportNode = exportRef.current

    const updateBaseSize = () => {
      const { height, width } = exportNode.getBoundingClientRect()
      setBaseSize({ height: Math.round(height), width: Math.round(width) })
    }
    const observer = new ResizeObserver(updateBaseSize)

    updateBaseSize()
    observer.observe(exportNode)
    return () => observer.disconnect()
  }, [post, showParentPost, status, theme, xAppearance])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const platform = getPostPlatform(url)
    if (!platform) {
      setError('Paste a public Instagram or X post URL to continue.')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch(
        `/api/${platform}?url=${encodeURIComponent(url)}`,
      )
      const responseText = await response.text()
      let payload: SocialPostData & ApiError

      try {
        payload = JSON.parse(responseText) as SocialPostData & ApiError
      } catch {
        throw new Error(
          'The post loader is not running. Restart the app with npm run dev.',
        )
      }

      if (!response.ok)
        throw new Error(payload.error || 'Could not load this post.')
      setPost(payload)
      setShowParentPost(false)
      setStatus('ready')
    } catch (requestError) {
      setStatus('idle')
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load this post.',
      )
    }
  }

  function useExample() {
    setUrl('https://www.instagram.com/p/C-example/')
    setError('')
    setPost(samplePost)
    setShowParentPost(false)
    setStatus('loading')
    window.setTimeout(() => setStatus('ready'), 500)
  }

  async function downloadImage() {
    if (!exportRef.current || isDownloading) return
    setIsDownloading(true)
    setError('')

    try {
      await document.fonts.ready
      const backgroundColors: Partial<Record<ExportTheme, string>> = {
        paper: post.platform === 'x' ? '#ffffff' : '#efefef',
        ink: '#000000',
        coral: '#ed694b',
      }
      const options: Exclude<Parameters<typeof toPng>[1], undefined> = {
        cacheBust: true,
        pixelRatio: quality,
      }
      if (theme !== 'transparent') {
        options.backgroundColor = backgroundColors[theme]
      }

      let downloadUrl: string
      let extension: 'mp4' | 'png'

      if (post.mediaType === 'video') {
        const canvas = exportRef.current
        const media = canvas.querySelector<HTMLElement>('[data-video-media]')
        if (!media) throw new Error('The video area could not be measured.')

        const canvasRect = canvas.getBoundingClientRect()
        const mediaRect = media.getBoundingClientRect()
        const mediaBorderRadius = Number.parseFloat(
          window.getComputedStyle(media).borderRadius,
        )
        media.classList.add('export-video-mask')
        options.backgroundColor = backgroundColors[theme] || '#000000'

        let frameDataUrl
        try {
          frameDataUrl = await toPng(canvas, options)
        } finally {
          media.classList.remove('export-video-mask')
        }

        const response = await fetch('/api/video-export', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            frameDataUrl,
            mediaRect: {
              x: Math.round((mediaRect.left - canvasRect.left) * quality),
              y: Math.round((mediaRect.top - canvasRect.top) * quality),
              width: Math.round(mediaRect.width * quality),
              height: Math.round(mediaRect.height * quality),
              borderRadius: Math.round(mediaBorderRadius * quality),
            },
            outputSize: {
              width: Math.round(canvasRect.width * quality),
              height: Math.round(canvasRect.height * quality),
            },
            url,
          }),
        })
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as ApiError
          throw new Error(
            payload.error || 'The video post could not be exported.',
          )
        }

        downloadUrl = URL.createObjectURL(await response.blob())
        extension = 'mp4'
      } else {
        downloadUrl = await toPng(exportRef.current, options)
        extension = 'png'
      }

      const link = document.createElement('a')
      link.download = `${post.username}-${post.platform}-post-${quality}x.${extension}`
      link.href = downloadUrl
      document.body.appendChild(link)
      link.click()
      link.remove()
      if (extension === 'mp4') {
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
      setDownloaded(true)
      window.setTimeout(() => setDownloaded(false), 1800)
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'The preview could not be exported. Please try again.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function toggleMetric(name: MetricName) {
    setMetrics((current) => ({ ...current, [name]: !current[name] }))
  }

  const outputSize = {
    width: baseSize.width * quality,
    height: baseSize.height * quality,
  }

  return (
    <main>
      <SiteHeader
        theme={appTheme}
        onThemeChange={() =>
          setAppTheme((current) => (current === 'light' ? 'dark' : 'light'))
        }
      />
      <Hero
        error={error}
        metrics={metrics}
        onCreate={handleCreate}
        onUrlChange={setUrl}
        onUseExample={useExample}
        post={post}
        quality={quality}
        showCounts={showCounts}
        status={status}
        url={url}
        xAppearance={xAppearance}
        useOriginalMediaRatio={useOriginalMediaRatio}
        showParentPost={showParentPost}
      />

      <AnimatePresence initial={false}>
        {status === 'ready' && (
          <EditorWorkspace
            copied={copied}
            downloaded={downloaded}
            exportRef={exportRef}
            isDownloading={isDownloading}
            key="editor"
            metrics={metrics}
            onCopy={copyLink}
            onDownload={downloadImage}
            onFullscreen={() => setFullscreen(true)}
            onQualityChange={setQuality}
            onShowCountsChange={setShowCounts}
            onThemeChange={setTheme}
            onToggleMetric={toggleMetric}
            onShowParentPostChange={setShowParentPost}
            outputSize={outputSize}
            post={post}
            quality={quality}
            showCounts={showCounts}
            theme={theme}
            xAppearance={xAppearance}
            onXAppearanceChange={setXAppearance}
            onUseOriginalMediaRatioChange={setUseOriginalMediaRatio}
            showParentPost={showParentPost}
            useOriginalMediaRatio={useOriginalMediaRatio}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreen && (
          <PreviewModal
            key="preview"
            metrics={metrics}
            onClose={() => setFullscreen(false)}
            outputSize={outputSize}
            post={post}
            quality={quality}
            showCounts={showCounts}
            theme={theme}
            xAppearance={xAppearance}
            useOriginalMediaRatio={useOriginalMediaRatio}
            showParentPost={showParentPost}
          />
        )}
      </AnimatePresence>

      <HowItWorks />
      <SiteFooter />
    </main>
  )
}
