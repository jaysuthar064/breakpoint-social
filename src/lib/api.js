/**
 * Reads the public API.
 *
 * The whole site arrives in one `/snapshot` call. For a marketing site this
 * size that is a single request instead of a dozen, and it is what the
 * prerender step consumes too, so the static HTML and the live page are built
 * from exactly the same data.
 */

/*
 * No silent fallback.
 *
 * A default of `http://localhost:8887` is invisible in development and fatal in
 * production: the built site asks every visitor's browser for a server only the
 * developer has. Missing configuration should be obvious at build time, not a
 * blank page for real users.
 */
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error(
    'VITE_API_BASE is not set. Add it to frontend/.env (see DEPLOY-RUNBOOK.md).',
  );
}

/**
 * Builds a REST URL that works with or without pretty permalinks.
 */
export function apiUrl(path) {
  return API_BASE.includes('rest_route=')
    ? `${API_BASE}${encodeURIComponent(path)}`
    : `${API_BASE.replace(/\/$/, '')}${path}`;
}

/**
 * Fetches the whole published site.
 */
export async function fetchSnapshot(signal) {
  const response = await fetch(apiUrl('/bps/v1/snapshot'), { signal });

  if (!response.ok) {
    throw new Error(`The site content could not be loaded (${response.status}).`);
  }

  return response.json();
}

/**
 * Fetches one page, used for draft previews.
 */
export async function fetchPage(route, previewToken) {
  const path = `/bps/v1/page/${route}`;
  const url = previewToken
    ? `${apiUrl(path)}&preview=${encodeURIComponent(previewToken)}`
    : apiUrl(path);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`That page could not be loaded (${response.status}).`);
  }

  return response.json();
}

/**
 * Asks for a contact-form token.
 *
 * The server uses it to reject submissions that arrive impossibly fast, which
 * is most of the spam.
 */
export async function fetchContactToken() {
  const response = await fetch(apiUrl('/bps/v1/contact/token'));

  if (!response.ok) {
    throw new Error('The contact form could not be prepared.');
  }

  return response.json();
}

/**
 * Submits the contact form.
 */
export async function submitContact(payload) {
  const response = await fetch(apiUrl('/bps/v1/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message ?? 'That could not be sent.');
    error.field = body.data?.field ?? null;
    throw error;
  }

  return body;
}

const SNAPSHOT_KEY = 'bps.snapshot.v1';

/**
 * Reads a previously fetched snapshot from this browsing session.
 *
 * The API takes around a second to answer, and without this every reload pays
 * it again. Session storage is the right scope: it survives reloads and
 * in-session navigation, and is gone when the tab closes, so an editor never
 * ends up looking at yesterday's content.
 *
 * Every access is wrapped: storage throws in private mode and in some embedded
 * webviews, and a cache miss must never be fatal.
 */
export function readCachedSnapshot() {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    // Two minutes. Long enough to make reloads instant, short enough that an
    // editor checking their work is not misled for long.
    if (!parsed.at || Date.now() - parsed.at > 120000) {
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Stores the snapshot for the rest of the session.
 */
export function cacheSnapshot(data) {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Quota or a blocked store. The site works without it.
  }
}
