/**
 * Promotes heading levels inside CMS body copy.
 *
 * The editor writes h3 and h4, which is the right choice inside a section that
 * already has its own h2. But when a body sits directly under the page h1 with
 * no h2 between them, those h3s create a level skip, and screen reader users
 * navigating by heading land on a structure that claims a missing level.
 *
 * Rather than restrict what the editor can write, the level is adjusted at
 * render time to match the surrounding document.
 *
 * @param {string}  html    Sanitised body HTML from the API.
 * @param {boolean} promote True when the body is the first thing under the h1.
 */
export function fixHeadingLevels(html, promote) {
  if (!html || !promote) {
    return html ?? '';
  }

  // h4 first, so an already-promoted h3 is not promoted twice in one pass.
  return html.replace(/<(\/?)h4(\s|>)/g, '<$1h3$2').replace(/<(\/?)h3(\s|>)/g, '<$1h2$2');
}
