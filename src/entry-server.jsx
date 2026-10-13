import { renderToString } from 'react-dom/server';

import App from './App.jsx';

/**
 * Server entry for the prerender step.
 *
 * Built by Vite with `--ssr`, which transforms the JSX that Node cannot parse
 * on its own and resolves the same module graph the browser bundle uses. That
 * shared graph is the point: the static HTML and the hydrated page come from
 * one source, so they cannot drift.
 */
export function render(snapshot, route) {
  return renderToString(<App snapshot={snapshot} initialPath={route} />);
}
