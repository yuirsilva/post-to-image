const steps = [
  ['Paste the link', 'Copy an Instagram or X post URL.'],
  ['Choose your output', 'Set background, quality, and visible counts.'],
  ['Download', 'Save the complete post as a PNG or MP4.'],
]

export function HowItWorks() {
  return (
    <section
      className="max-w-site border-line mx-auto grid w-full grid-cols-1 gap-12 border-t px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-24 lg:py-24"
      id="how-it-works"
    >
      <div>
        <h2 className="font-display max-w-xl text-4xl leading-tight font-bold tracking-tighter sm:text-5xl">
          The post, exactly how people recognize it.
        </h2>
        <p className="text-muted mt-5 max-w-md leading-relaxed">
          Keep the familiar Instagram or X layout, creator, caption, engagement,
          and context together.
        </p>
      </div>
      <ol>
        {steps.map(([title, description], index) => (
          <li
            className="border-line grid grid-cols-[auto_1fr] gap-4 border-b py-6 first:pt-0"
            key={title}
          >
            <span className="bg-ink text-on-ink grid size-8 place-items-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <div>
              <strong className="font-display text-lg leading-8 font-bold">
                {title}
              </strong>
              <p className="text-muted mt-2 text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
