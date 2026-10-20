/**
 * The site's navigation, from the pages the editor has published.
 *
 * Shared rather than duplicated: the homepage carries its own header, ported
 * from a standalone app that had its links written out by hand. That list drifted
 * from the rest of the site immediately -- it was missing Our Work and Contact
 * Us, and pointed "Our Work" at an on-page anchor rather than the real page.
 * Both headers now read this, so adding a page updates the whole site.
 */

/**
 * Nav entries, in the order the editor arranged the pages.
 *
 * The homepage is excluded: it is reached by the logo everywhere else, and the
 * homepage's own header adds it explicitly.
 *
 * @param {object|null} snapshot The `/snapshot` payload.
 */
export function buildNav(snapshot) {
  return Object.values(snapshot?.pages ?? {})
    .filter((page) => page.route !== '')
    .map((page) => ({
      id: page.id,
      label: page.title,
      path: `/${page.route}/`,
    }));
}

/**
 * The same list with Home in front, for a header that sits on the homepage.
 *
 * @param {object|null} snapshot The `/snapshot` payload.
 * @param {Array} fallback Used when the CMS has no pages yet.
 */
export function buildHomeNav(snapshot, fallback = []) {
  const pages = buildNav(snapshot);

  if (pages.length === 0) {
    return fallback;
  }

  return [{ id: 'home', label: 'Home', path: '/' }, ...pages];
}
