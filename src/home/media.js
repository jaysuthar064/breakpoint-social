/**
 * Where the campaign videos are served from.
 *
 * The CMS stores a video as a site-relative path -- `/videos/DUGu1FSgQd3.mp4` --
 * on purpose. An absolute URL baked into the content would pin it to whichever
 * machine imported it, which is the exact problem that made every other field
 * store an id rather than a URL.
 *
 * The 36 files are 239MB, so they cannot be committed or deployed with the
 * site. `VITE_VIDEO_BASE` is how a build says where they actually live:
 *
 *   unset   -> /videos/x.mp4          served from frontend/public (local work)
 *   set     -> <base>/videos/x.mp4    a CDN, a bucket, or the WordPress uploads
 *
 * Posters are unaffected: those are real media-library attachments and already
 * arrive as absolute URLs from the API.
 */

const BASE = String(import.meta.env.VITE_VIDEO_BASE ?? '').replace(/\/+$/, '');

/**
 * The URL a <video> should actually load.
 *
 * Deliberately not called `videoSrc`: MediaLightbox already has a local
 * `const videoSrc`, and an import of the same name is shadowed by it. Calls
 * made before that line then hit its temporal dead zone and throw, which takes
 * the whole page down with a blank screen rather than a broken player.
 *
 * @param {string} path Stored path, or an absolute URL.
 */
export function resolveVideoSrc(path) {
  const value = String(path ?? '').trim();

  if (value === '') {
    return '';
  }

  // Already absolute, or a data/blob URL: leave it alone. A campaign may point
  // at a video that is hosted somewhere else entirely.
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) {
    return value;
  }

  if (BASE === '') {
    return value;
  }

  return BASE + (value.startsWith('/') ? value : '/' + value);
}
