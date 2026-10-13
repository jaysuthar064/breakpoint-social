/**
 * What the page shows while the content is still in flight.
 *
 * Shaped like the real layout rather than a spinner: a skeleton that matches
 * the header bar and hero means the page appears to assemble, and the moment
 * content arrives nothing jumps. A centred spinner tells the reader to wait
 * without telling them what for.
 */
export function Loading() {
  return (
    <div
      // polite, not assertive: this is a status, not an interruption.
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[100dvh] bg-[#fcf5e9]"
    >
      <span className="sr-only">Loading the site</span>

      {/* Header placeholder, same height and rhythm as the real one. */}
      <div className="border-b border-[#84572f]/10 bg-[#fcf5e9]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="skeleton h-9 w-40 rounded-lg" />

          <div className="hidden items-center gap-6 lg:flex">
            {[64, 44, 72, 60, 58, 72].map((width, index) => (
              <div key={index} className="skeleton h-4 rounded" style={{ width }} />
            ))}
            <div className="skeleton h-10 w-32 rounded-full" />
          </div>

          <div className="skeleton h-9 w-16 rounded-lg lg:hidden" />
        </div>
      </div>

      {/* Hero placeholder: two headline bars, a line of subtext, two buttons. */}
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <div className="skeleton mx-auto h-12 w-full max-w-2xl rounded-xl sm:h-16" />
        <div className="skeleton mx-auto mt-4 h-12 w-4/5 max-w-xl rounded-xl sm:h-16" />

        <div className="skeleton mx-auto mt-8 h-4 w-full max-w-lg rounded" />
        <div className="skeleton mx-auto mt-3 h-4 w-3/5 max-w-sm rounded" />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <div className="skeleton h-12 w-40 rounded-full" />
          <div className="skeleton h-12 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}
