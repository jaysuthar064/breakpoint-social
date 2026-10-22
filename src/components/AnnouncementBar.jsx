/**
 * The strip above the header.
 *
 * Site-wide, and rendered from settings rather than from a page section: it
 * appears on every page, and one line of copy kept in seven places is one
 * line of copy that will disagree with itself.
 *
 * Renders nothing when the setting is empty, which is how an editor turns the
 * bar off.
 */
export function AnnouncementBar({ text }) {
  const message = String(text ?? '').trim();

  if (message === '') {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-[#84572f] px-4 py-1.5 text-center text-[11px] font-semibold tracking-wider text-white uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-[#f1d5a0] motion-safe:animate-pulse" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
