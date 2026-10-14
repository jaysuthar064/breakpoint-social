/**
 * Generates static HTML for every route.
 *
 * Decision D6: the site is prerendered rather than server-rendered. A
 * client-rendered SPA ships an empty <div id="root"> to crawlers, and this site
 * already ranks for "San Diego social media agency", so shipping it without
 * real HTML would put those rankings at risk.
 *
 * This runs after `vite build`. It fetches the published snapshot once, renders
 * each route to HTML with React's static renderer, and writes one file per
 * route alongside an inlined copy of the snapshot so the browser can hydrate
 * without a second fetch.
 *
 * usage: node prerender.js [api-base]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, 'dist');

/**
 * Reads .env.local / .env so `npm run prerender` uses the same configuration as
 * the Vite build. Without this the client bundle and the prerendered HTML could
 * be pointed at two different APIs and nobody would notice until production.
 */
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = resolve(here, name);

    if (!existsSync(file)) {
      continue;
    }

    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line) => {
        const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);

        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      });
  }
}

loadEnv();

const API_BASE = process.argv[2] ?? process.env.VITE_API_BASE ?? 'http://localhost:8887/index.php?rest_route=';

function apiUrl(path) {
  return API_BASE.includes('rest_route=')
    ? `${API_BASE}${encodeURIComponent(path)}`
    : `${API_BASE.replace(/\/$/, '')}${path}`;
}

/**
 * Escapes a snapshot for safe embedding in a <script> block.
 *
 * Without this, a `</script>` sequence inside any content field would close the
 * tag early and break the page.
 */
function embed(json) {
  return JSON.stringify(json)
    .replace(/</g, '\u003c')
    .replace(/>/g, '\u003e')
    .replace(/&/g, '\u0026');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('prerender: run `npm run build` first.');
    process.exit(1);
  }

  let snapshot;

  try {
    const response = await fetch(apiUrl('/bps/v1/snapshot'));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    snapshot = await response.json();
  } catch (error) {
    // Failing loudly matters: silently shipping empty HTML is exactly the
    // outcome this step exists to prevent.
    console.error(`prerender: could not reach the API (${error.message}).`);
    console.error(`prerender: tried ${apiUrl('/bps/v1/snapshot')}`);
    process.exit(1);
  }

  // Built by `vite build --ssr`, because Node cannot parse JSX and the source
  // tree cannot be imported directly.
  const ssrEntry = resolve(here, 'dist-ssr', 'entry-server.js');

  if (!existsSync(ssrEntry)) {
    console.error('prerender: missing dist-ssr/entry-server.js. Run `npm run build` first.');
    process.exit(1);
  }

  const { render } = await import(pathToFileURL(ssrEntry).href);

  const template = loadTemplate();

  const routes = ['/'];

  Object.values(snapshot.pages ?? {}).forEach((page) => {
    if (page.route !== '') {
      routes.push(`/${page.route}/`);
    }
  });

  (snapshot.collections?.post ?? []).forEach((post) => {
    routes.push(`/blog/${post.slug}/`);
  });

  (snapshot.collections?.case_study ?? []).forEach((study) => {
    routes.push(`/our-work/${study.slug}/`);
  });

  let written = 0;
  const missingDescriptions = [];

  // Needed inside the loop for canonical and og:url, so resolved up front.
  const siteUrl = (process.env.SITE_URL ?? 'https://breakpointsocial.com').replace(/\/$/, '');

  for (const route of routes) {
    let html = '';

    try {
      html = render(snapshot, route);
    } catch (error) {
      console.warn(`prerender: ${route} could not be rendered (${error.message}); shipping the shell.`);
    }

    const page = findPage(snapshot, route);

    let output = template
      .replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>\n    <script>window.__BPS_SNAPSHOT__ = ${embed(snapshot)};</script>`,
      )
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace('</head>', `${buildHead(snapshot, route, page, siteUrl)}  </head>`);

    // Only override the description when the page actually has one. Writing an
    // empty string would replace the template's sensible site-wide default with
    // nothing, which is worse than leaving it alone.
    if (page.description) {
      output = output.replace(
        /(<meta\s+name="description"\s+content=")[^"]*(")/,
        `$1${escapeHtml(page.description)}$2`,
      );
    } else {
      missingDescriptions.push(route);
    }

    const target = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html');

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, output, 'utf8');

    written += 1;
    console.log(`prerender: ${route}`);
  }

  // A sitemap and robots.txt are the other half of being crawlable: the HTML
  // is now real, but nothing tells a crawler which URLs exist.
  const today = new Date().toISOString().slice(0, 10);

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .map(
        (route) =>
          `  <url>\n    <loc>${siteUrl}${route}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n  </url>`,
      )
      .join('\n') +
    '\n</urlset>\n';

  writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8');

  writeFileSync(
    join(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
    'utf8',
  );

  console.log(`prerender: wrote sitemap.xml (${routes.length} urls) and robots.txt`);

  // Image URLs come from whatever WordPress reports. Prerendering a production
  // build against a local API bakes localhost URLs into og:image and every
  // <img>, which looks fine locally and is broken for every visitor and every
  // social share. Worth shouting about rather than discovering after launch.
  const sampleImage = snapshot.settings?.logo?.url ?? '';

  if (sampleImage && !siteUrl.includes('localhost') && /localhost|127\.0\.0\.1/.test(sampleImage)) {
    console.warn('');
    console.warn('prerender: WARNING - image URLs point at localhost but SITE_URL does not.');
    console.warn(`prerender:   example: ${sampleImage}`);
    console.warn('prerender:   Set VITE_API_BASE to the production API before building for release,');
    console.warn('prerender:   or every image and social preview will be broken in production.');
    console.warn('');
  }
  console.log(`prerender: wrote ${written} routes.`);

  // Worth saying out loud: these pages fall back to the site-wide description,
  // which is a missed SEO opportunity rather than an error.
  if (missingDescriptions.length > 0) {
    console.warn(`prerender: ${missingDescriptions.length} route(s) have no SEO description:`);
    missingDescriptions.forEach((route) => console.warn(`  ${route}`));
  }
}

/**
 * Returns a pristine copy of the built HTML shell.
 *
 * This exists because route `/` writes to `dist/index.html`, which is also
 * where the template is read from. Re-running prerender without rebuilding
 * would otherwise read its own previous output: the `<div id="root"></div>`
 * marker is already filled, so the replace quietly becomes a no-op and the
 * command reports success while shipping stale markup. Silent staleness after
 * a content change is the worst failure this script could have.
 *
 * A copy of the shell is stashed on the first run after each build, outside
 * `dist` so it is never deployed, and every run reads from that.
 */
function loadTemplate() {
  const built = join(dist, 'index.html');
  const stash = resolve(here, '.prerender-template.html');

  const current = readFileSync(built, 'utf8');
  const isPristine = current.includes('<div id="root"></div>');

  if (isPristine) {
    writeFileSync(stash, current, 'utf8');

    return current;
  }

  if (existsSync(stash)) {
    return readFileSync(stash, 'utf8');
  }

  console.error('prerender: dist/index.html has already been prerendered and no pristine copy was');
  console.error('prerender: stashed. Run `npm run build` first so the shell is regenerated.');
  process.exit(1);

  return '';
}

/**
 * The <title> for a page.
 */
function pageTitle(page, route) {
  const SITE = 'Breakpoint Social | San Diego Social Media Agency';
  const seoTitle = page.seo?.title ?? '';

  // The API falls back to the page's own name when no SEO title is set, so an
  // unset title arrives looking identical to a deliberate one. Treating them
  // as the same is what produced a homepage titled simply "Home".
  const hasCustomTitle = seoTitle !== '' && seoTitle !== page.title;

  if (route === '/') {
    return hasCustomTitle ? seoTitle : SITE;
  }

  const name = hasCustomTitle ? seoTitle : page.title;

  return name ? `${name} | Breakpoint Social` : SITE;
}

function findPage(snapshot, route) {
  // Case studies have their own route shape and are not pages.
  if (route.indexOf('/our-work/') === 0 && route !== '/our-work/') {
    const slug = route.replace(/^\/our-work\//, '').replace(/\/$/, '');
    const study = ((snapshot.collections && snapshot.collections.case_study) || []).find(
      function (entry) { return entry.slug === slug; },
    );

    if (study) {
      return {
        title: study.title + ' | Breakpoint Social',
        description: study.summary || '',
      };
    }
  }

  const key = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
  const page = snapshot.pages?.[key];

  if (page) {
    return {
      // The front page gets the site-wide title. "Home | Breakpoint Social" is
      // a wasted <title> on the one page most likely to appear in results.
      title: pageTitle(page, route),
      description: page.seo?.description ?? '',
    };
  }

  const slug = key.replace(/^blog\//, '');
  const post = (snapshot.collections?.post ?? []).find((entry) => entry.slug === slug);

  if (post) {
    return {
      title: `${post.title} | Breakpoint Social`,
      description: post.excerpt ?? '',
    };
  }

  return {
    title: 'Breakpoint Social | San Diego Social Media Agency',
    description: '',
  };
}

main();


/**
 * Builds the per-route head tags.
 *
 * Without these, every page shares one og:title and has no canonical: a share
 * of any inner page shows the homepage's card, and search engines see several
 * URLs claiming the same identity. Prerendering only solves half the problem
 * if the head is identical everywhere.
 */
function buildHead(snapshot, route, page, siteUrl) {
  const url = siteUrl + route;
  const branding = snapshot.settings || {};
  const image = branding.logo && branding.logo.url ? branding.logo.url : '';

  const tags = [
    '<link rel="canonical" href="' + escapeHtml(url) + '">',
    '<meta property="og:url" content="' + escapeHtml(url) + '">',
    '<meta property="og:title" content="' + escapeHtml(page.title) + '">',
    '<meta property="og:site_name" content="Breakpoint Social">',
    '<meta name="twitter:title" content="' + escapeHtml(page.title) + '">',
    '<meta name="theme-color" content="#fcf5e9">',
  ];

  if (page.description) {
    tags.push('<meta property="og:description" content="' + escapeHtml(page.description) + '">');
    tags.push('<meta name="twitter:description" content="' + escapeHtml(page.description) + '">');
  }

  if (image) {
    tags.push('<meta property="og:image" content="' + escapeHtml(image) + '">');
    tags.push('<meta name="twitter:image" content="' + escapeHtml(image) + '">');
  }

  const studySlug = route.replace(/^\/our-work\//, '').replace(/\/$/, '');
  const study = ((snapshot.collections && snapshot.collections.case_study) || []).find(
    function (entry) { return entry.slug === studySlug; },
  );

  if (route.indexOf('/our-work/') === 0 && study) {
    tags.push('<meta property="og:type" content="article">');
  }

  const slug = route.replace(/^\/blog\//, '').replace(/\/$/, '');
  const posts = (snapshot.collections && snapshot.collections.post) || [];
  const post = posts.find(function (entry) { return entry.slug === slug; });

  let jsonLd;

  if (route.indexOf('/blog/') === 0 && post) {
    tags.push('<meta property="og:type" content="article">');

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || '',
      datePublished: post.publishedAt || undefined,
      mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: 'Breakpoint Social', url: siteUrl },
    };
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Breakpoint Social',
      url: siteUrl,
      description:
        'A San Diego social media and influencer marketing agency building campaigns that spark movements.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'San Diego',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
      email: 'taylor@breakpointsocial.com',
      telephone: '+1-818-312-5428',
    };

    if (image) {
      jsonLd.logo = image;
    }
  }

  tags.push(
    '<script type="application/ld+json">' +
      JSON.stringify(jsonLd).replace(/</g, '\u003c') +
      '</script>',
  );

  return '  ' + tags.join('\n  ') + '\n';
}
