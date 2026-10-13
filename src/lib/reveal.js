/**
 * Scroll-reveal, built on IntersectionObserver.
 *
 * Deliberately NOT a scroll listener. A `scroll` handler fires on every frame,
 * cannot be batched, and is the usual reason a site feels heavy on a phone.
 * IntersectionObserver does the same job off the main thread.
 *
 * The guiding rule is that content must never depend on this to be visible:
 *
 *  - The CSS only hides an element once `data-reveal-ready` is on <html>, and
 *    only this script sets it. No JavaScript means nothing is ever hidden, so
 *    the prerendered HTML a crawler sees is the finished page.
 *  - Under `prefers-reduced-motion` the attribute is never set at all, so the
 *    page renders complete and still.
 *  - Anything already on screen at load is revealed immediately rather than
 *    animated, so the first paint is not a wave of fading boxes.
 */

const REVEAL_SELECTOR = '[data-reveal]';

export function initReveal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Respect the setting, and keep respecting it if it changes mid-session.
  if (prefersReduced.matches || !('IntersectionObserver' in window)) {
    document.documentElement.removeAttribute('data-reveal-ready');

    return () => {};
  }

  document.documentElement.setAttribute('data-reveal-ready', '');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.setAttribute('data-revealed', '');
        // One-shot: re-animating on every scroll past is noise, not feedback.
        observer.unobserve(entry.target);
      });
    },
    {
      // Start slightly before the element reaches the viewport so the motion
      // has finished by the time it is properly in view.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.08,
    },
  );

  const observe = () => {
    document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
      if (element.hasAttribute('data-revealed')) {
        return;
      }

      // Already on screen at load: show it now, do not animate it in.
      const box = element.getBoundingClientRect();

      if (box.top < window.innerHeight * 0.9) {
        element.setAttribute('data-revealed', '');

        return;
      }

      observer.observe(element);
    });
  };

  observe();

  // Client-side navigation swaps the whole page, so new targets appear.
  const mutation = new MutationObserver(() => observe());
  mutation.observe(document.body, { childList: true, subtree: true });

  const onPreferenceChange = (event) => {
    if (event.matches) {
      document.documentElement.removeAttribute('data-reveal-ready');
      observer.disconnect();
    }
  };

  prefersReduced.addEventListener('change', onPreferenceChange);

  return () => {
    observer.disconnect();
    mutation.disconnect();
    prefersReduced.removeEventListener('change', onPreferenceChange);
  };
}
