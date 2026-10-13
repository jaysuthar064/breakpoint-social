/**
 * The motion layer beyond scroll reveal.
 *
 * Three techniques, each chosen because it does something a fade cannot, and
 * each a progressive enhancement: if the browser lacks the API, or the reader
 * has asked for less movement, the page is simply still and complete.
 *
 *  1. View Transitions   - routes cross-fade as one document instead of
 *                          snapping, which is what makes a client-side site
 *                          stop feeling like a series of blank flashes.
 *  2. Magnetic pointer   - the primary call to action leans toward the cursor.
 *                          Pointer-driven, never scroll-driven.
 *  3. Scroll progress    - a reading indicator on long articles, driven by the
 *                          native scroll timeline so it costs no JavaScript
 *                          frame time at all.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED).matches;
}

/**
 * Runs a route change inside a View Transition when the browser supports one.
 *
 * Falls through to calling the update directly, so navigation never depends on
 * the API being present.
 *
 * @param {Function} update Performs the actual navigation.
 */
export function withViewTransition(update) {
  if (typeof document === 'undefined' || !document.startViewTransition || reducedMotion()) {
    update();

    return;
  }

  document.startViewTransition(() => update());
}

/**
 * Makes an element lean toward the pointer.
 *
 * Deliberately subtle and capped: a button that chases the cursor across the
 * page is a gimmick, one that shifts a few pixels reads as responsive. Skipped
 * entirely on coarse pointers, where there is no cursor to follow and the
 * transform would only fight the tap.
 */
export function initMagnetic() {
  if (typeof window === 'undefined' || reducedMotion()) {
    return () => {};
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return () => {};
  }

  const STRENGTH = 0.22;
  const MAX = 7;

  const onMove = (event) => {
    const target = event.target.closest?.('[data-magnetic]');

    if (!target) {
      return;
    }

    const box = target.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);

    const x = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
    const y = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));

    target.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onLeave = (event) => {
    const target = event.target.closest?.('[data-magnetic]');

    if (target) {
      target.style.transform = '';
    }
  };

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave, true);

  return () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave, true);
  };
}

/**
 * Whether the browser can drive an animation from the scroll position itself.
 *
 * When it can, the reading progress bar is pure CSS and never touches the main
 * thread. When it cannot, the bar is simply not shown: a progress indicator is
 * a nicety, and faking it with a scroll listener would cost more than it is
 * worth.
 */
export function supportsScrollTimeline() {
  return (
    typeof CSS !== 'undefined' &&
    CSS.supports?.('animation-timeline: scroll()') === true &&
    !reducedMotion()
  );
}
