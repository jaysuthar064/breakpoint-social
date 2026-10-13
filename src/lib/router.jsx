import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { withViewTransition } from './motion.js';

/**
 * A history-API router.
 *
 * Real paths, not hashes: the site has to be crawlable and the prerender step
 * writes one HTML file per path. A hash route would leave every page sharing a
 * single URL as far as a crawler is concerned.
 */

const RouterContext = createContext({ path: '/', navigate: () => {} });

function normalise(path) {
  if (!path || path === '/') {
    return '/';
  }

  // One canonical form, with a trailing slash, so `/about-us` and `/about-us/`
  // are never treated as two different pages.
  const trimmed = path.replace(/\/+$/, '');

  return `${trimmed}/`;
}

function currentPath(fallback = '/') {
  if (typeof window === 'undefined') {
    return normalise(fallback);
  }

  return normalise(window.location.pathname);
}

/**
 * `initialPath` is what makes prerendering possible: on the server there is no
 * `window.location` to read, so the route has to be passed in.
 */
export function RouterProvider({ children, initialPath = '/' }) {
  const [path, setPath] = useState(() => currentPath(initialPath));

  useEffect(() => {
    const onPop = () => setPath(currentPath());

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const target = normalise(to);

    // Wrapped so the browser can cross-fade the old and new page as one
    // document. Without it a client-side route change is an instant swap,
    // which reads as a flash rather than a navigation.
    withViewTransition(() => {
      if (replace) {
        window.history.replaceState({}, '', target);
      } else {
        window.history.pushState({}, '', target);
      }

      setPath(target);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

/**
 * An internal link.
 *
 * Renders a real anchor with a real href, so middle-click, copy-link, "open in
 * new tab" and crawlers all behave. The click handler is an enhancement that
 * avoids a full page load, and it steps aside for modified clicks.
 */
export function Link({ to, children, className, ...rest }) {
  const { navigate } = useRouter();

  const isExternal = /^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:');

  if (isExternal) {
    return (
      <a href={to} className={className} rel="noopener" {...rest}>
        {children}
      </a>
    );
  }

  // A bare fragment stays a normal anchor so the browser handles the jump.
  if (to.startsWith('#')) {
    return (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    );
  }

  const [pathPart, hash] = to.split('#');

  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    navigate(pathPart);

    if (hash) {
      // Let the new page paint before trying to find the target.
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  return (
    <a href={to} onClick={onClick} className={className} {...rest}>
      {children}
    </a>
  );
}
