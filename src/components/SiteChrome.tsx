import { ImagesSquareIcon } from '@phosphor-icons/react'

function Brand() {
  return (
    <a
      className="font-display text-ink inline-flex items-center gap-2.5 text-xl font-extrabold no-underline"
      href="#top"
    >
      <span className="bg-brand grid size-8 -rotate-3 place-items-center rounded-lg text-white">
        <ImagesSquareIcon size={18} weight="bold" />
      </span>
      <span>postcard</span>
    </a>
  )
}

export function SiteHeader() {
  return (
    <header className="max-w-site border-line mx-auto flex h-19 w-full items-center border-b px-4 sm:px-6">
      <Brand />
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="max-w-site border-line text-muted mx-auto grid min-h-28 w-full grid-cols-1 items-center gap-3.5 border-t px-4 py-8 text-xs sm:px-6 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:py-0">
      <Brand />
      <p>Made for sharing posts beyond the feed.</p>
      <p className="md:justify-self-end">Not affiliated with Instagram or X.</p>
    </footer>
  )
}
