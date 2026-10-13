import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import App from './App.jsx';
import './styles.css';

const container = document.getElementById('root');

/**
 * Hydrate when the page was prerendered, mount fresh otherwise.
 *
 * Calling createRoot on prerendered markup would throw the static HTML away and
 * re-render from scratch, which defeats the point of generating it.
 */
if (container.hasChildNodes() && window.__BPS_SNAPSHOT__) {
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
