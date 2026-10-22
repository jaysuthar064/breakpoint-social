import { useEffect, useMemo, useState } from 'react';

import { cacheSnapshot, fetchSnapshot, readCachedSnapshot } from './lib/api.js';
import { fixHeadingLevels } from './lib/headings.js';
import { initMagnetic, supportsScrollTimeline } from './lib/motion.js';
import { initReveal } from './lib/reveal.js';
import { buildNav } from './lib/nav.js';
import { Link, RouterProvider, useRouter } from './lib/router.jsx';
import { AnnouncementBar } from './components/AnnouncementBar.jsx';
import { Footer, Header, SkipLink } from './components/Chrome.jsx';
import { Loading } from './components/Loading.jsx';
import { ContactForm } from './components/ContactForm.jsx';
import { CaseStudy } from './components/CaseStudy.jsx';
import { SECTION_COMPONENTS } from './components/sections.jsx';
import { HomeShowcase } from './home/HomeShowcase.tsx';

/**
 * The public site.
 *
 * Everything renders from one `/snapshot` payload. When the page was
 * prerendered, that payload is already embedded in the HTML, so the first paint
 * needs no network at all.
 */

/**
 * Reads the snapshot the prerender step inlined, if there is one.
 */
const HOME_TITLE = 'Breakpoint Social | San Diego Social Media Agency';
const HOME_DESCRIPTION =
  "Explore Breakpoint Social's creative campaigns, influencer collaborations, and social media marketing work.";

function initialSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  // Prerendered HTML carries the payload inline, so there is no wait at all.
  // Failing that, a snapshot from earlier in this session beats a second of
  // blank screen while the API answers again.
  return window.__BPS_SNAPSHOT__ ?? readCachedSnapshot();
}

export default function App({ snapshot: provided, initialPath = '/' }) {
  return (
    <RouterProvider initialPath={initialPath}>
      <Routes provided={provided} />
    </RouterProvider>
  );
}

/**
 * Picks between the homepage and the CMS-driven rest of the site.
 *
 * The homepage is the senior's standalone React page: it carries its own
 * header and footer and reads nothing from the CMS, so it renders without the
 * site chrome and without waiting on the API. Everything else needs the
 * snapshot, so only those routes gate on it.
 */
function Routes({ provided }) {
  const { path } = useRouter();
  const [snapshot, setSnapshot] = useState(() => provided ?? initialSnapshot());
  const [error, setError] = useState(null);

  // The homepage renders without <Site/>, which is where the per-route title
  // effect lives. Without this, navigating from /about/ back to / would leave
  // the document titled "About".
  useEffect(() => {
    if (path === '/' && typeof document !== 'undefined') {
      document.title = HOME_TITLE;
      setMeta('description', HOME_DESCRIPTION);
    }
  }, [path]);

  useEffect(() => {
    if (snapshot) {
      return undefined;
    }

    const controller = new AbortController();

    fetchSnapshot(controller.signal)
      .then((data) => {
        cacheSnapshot(data);
        setSnapshot(data);
      })
      .catch((caught) => {
        if (caught.name !== 'AbortError') {
          setError(caught);
        }
      });

    return () => controller.abort();
  }, [snapshot]);

  if (path === '/') {
    // The snapshot is passed when it happens to be there, and the homepage
    // falls back to its own copy when it is not.
    return <HomeShowcase snapshot={snapshot} />;
  }

  if (error) {
    return (
      <main
        role="alert"
        className="mx-auto flex min-h-[100dvh] max-w-xl flex-col justify-center px-6 text-center"
      >
        <h1 className="text-2xl font-extrabold tracking-tight">This site is not loading</h1>
        <p className="mt-3 leading-relaxed text-[#141615]/70">{error.message}</p>
        <p className="mt-8">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex rounded-full bg-[#84572f] px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#6c4625]"
          >
            Try again
          </button>
        </p>
      </main>
    );
  }

  if (!snapshot) {
    return <Loading />;
  }

  /* `fromNetwork` is false when the payload was already inline, so a
     prerendered page never fades: it is correct from the first frame. */
  return <Site snapshot={snapshot} fromNetwork={!provided && !initialSnapshot()} />;
}

function Site({ snapshot, fromNetwork = false }) {
  const { path } = useRouter();

  const nav = useMemo(() => buildNav(snapshot), [snapshot]);
  const view = useMemo(() => resolve(path, snapshot), [path, snapshot]);

  // Scroll reveal. Started once; the observer picks up new targets itself when
  // a route change swaps the page.
  useEffect(() => initReveal(), []);
  useEffect(() => initMagnetic(), []);

  // Keep the document head honest per route. Prerendering writes these into the
  // static HTML too, so crawlers see them without running any of this.
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = view.title;
    setMeta('description', view.description);
  }, [view]);

  return (
    <>
      <SkipLink />

      {/* A reading indicator earns its place on a long article and is noise
          anywhere else, so it is scoped to those routes. */}
      {(path.startsWith('/blog/') || path.startsWith('/our-work/')) &&
        path !== '/blog/' &&
        path !== '/our-work/' &&
        supportsScrollTimeline() && <div className="read-progress" aria-hidden="true" />}

      <AnnouncementBar text={snapshot.settings?.announcement} />

      <Header nav={nav} branding={snapshot.settings} />

      <main id="main" tabIndex={-1} className={fromNetwork ? 'content-enter' : undefined}>
        {view.element}
      </main>

      <Footer nav={nav} branding={snapshot.settings} />
    </>
  );
}

/**
 * Picks what to render for a path.
 */
function resolve(path, snapshot) {
  const posts = snapshot.collections?.post ?? [];

  // A blog post has its own route shape, so it is matched before pages.
  const postMatch = path.match(/^\/blog\/([^/]+)\/$/);

  if (postMatch) {
    const post = posts.find((entry) => entry.slug === postMatch[1]);

    if (post) {
      return {
        title: `${post.title} | Breakpoint Social`,
        description: post.excerpt ?? '',
        element: <BlogPost post={post} />,
      };
    }
  }

  // A case study has its own route under the Our Work page, so it is matched
  // before the page lookup would treat the whole path as a page slug.
  const studyMatch = path.match(/^\/our-work\/([^/]+)\/$/);

  if (studyMatch) {
    const studies = snapshot.collections?.case_study ?? [];
    const study = studies.find((entry) => entry.slug === studyMatch[1]);

    if (study) {
      return {
        title: `${study.title} | Breakpoint Social`,
        description: study.summary ?? '',
        element: (
          <CaseStudy
            study={study}
            others={studies.filter((entry) => entry.id !== study.id).slice(0, 3)}
          />
        ),
      };
    }
  }

  const route = path === '/' ? '' : path.replace(/^\/|\/$/g, '');
  const page = snapshot.pages?.[route];

  if (page) {
    const seoTitle = page.seo?.title ?? '';
    // The API defaults the SEO title to the page name, so an unset title looks
    // exactly like a deliberate one unless they are compared.
    const hasCustomTitle = seoTitle !== '' && seoTitle !== page.title;
    const name = hasCustomTitle ? seoTitle : page.title;

    return {
      title:
        route === ''
          ? (hasCustomTitle ? seoTitle : 'Breakpoint Social | San Diego Social Media Agency')
          : `${name} | Breakpoint Social`,
      description: page.seo?.description ?? '',
      element: <Page page={page} posts={posts} />,
    };
  }

  return {
    title: 'Not found | Breakpoint Social',
    description: '',
    element: <NotFound />,
  };
}

/**
 * Renders a page's section tree.
 */
function Page({ page, posts }) {
  const sections = page.sections ?? [];

  // The blog index is a page like any other, but its list of posts comes from
  // the collection rather than from a section.
  const isBlogIndex = page.route === 'blog';

  return (
    <>
      {sections.map((section) => {
        if (section.type === 'contact_form') {
          return <ContactSection key={section.id} section={section} />;
        }

        const Component = SECTION_COMPONENTS[section.type];

        // An unknown type renders nothing rather than taking down the page.
        if (!Component) {
          return null;
        }

        return <Component key={section.id} section={section} />;
      })}

      {isBlogIndex && <BlogList posts={posts} bare={sections.length === 0} />}

      {sections.length === 0 && !isBlogIndex && (
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
          <p className="mt-4 leading-relaxed text-[#141615]/70">
            This page has not been written yet.
          </p>
        </div>
      )}
    </>
  );
}

function ContactSection({ section }) {
  const { fields } = section;

  return (
    <section className="border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          {fields.eyebrow && (
            <span className="mb-4 inline-flex rounded-full border border-[#84572f]/15 bg-[#92ada4]/15 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-[#141615] uppercase">
              {fields.eyebrow}
            </span>
          )}
          <h2 className="text-3xl font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl">
            {fields.heading}
          </h2>
          {fields.intro && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#141615]/75">
              {fields.intro}
            </p>
          )}
        </div>

        <ContactForm
          submitLabel={fields.submit_label || 'Submit'}
          successTitle={fields.success_title}
          successBody={fields.success_body}
        />
      </div>
    </section>
  );
}

function BlogList({ posts, bare }) {
  return (
    <section className={`${bare ? 'py-20 md:py-28' : 'pb-20 md:pb-28'} bg-[#fcf5e9]`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {bare && (
          <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#141615] sm:text-5xl">
              Blog
            </h1>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="py-16 text-center text-[#141615]/60">No posts yet.</p>
        ) : (
          <div data-reveal data-reveal-stagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border border-[#84572f]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {post.coverImage?.url && (
                  <Link to={`/blog/${post.slug}/`} className="block aspect-[760/520] overflow-hidden">
                    <img
                      src={post.coverImage.url}
                      srcSet={post.coverImage.srcset || undefined}
                      sizes="(min-width: 1024px) 24rem, 100vw"
                      alt={post.coverImage.alt ?? ''}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                )}

                <div className="p-6">
                  {post.publishedAt && (
                    <time
                      dateTime={post.publishedAt}
                      className="font-mono text-xs tracking-wider text-[#84572f] uppercase"
                    >
                      {formatDate(post.publishedAt)}
                    </time>
                  )}

                  <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#141615]">
                    <Link
                      to={`/blog/${post.slug}/`}
                      className="transition-colors group-hover:text-[#84572f]"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  {post.excerpt && (
                    <p className="mt-2 leading-relaxed text-[#141615]/70">{post.excerpt}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BlogPost({ post }) {
  return (
    <article className="bg-[#fcf5e9] py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/blog/"
          className="mb-8 inline-block text-sm text-[#141615]/60 transition-colors hover:text-[#84572f]"
        >
          Back to all posts
        </Link>

        <header className="mb-10">
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="font-mono text-xs tracking-wider text-[#84572f] uppercase"
            >
              {formatDate(post.publishedAt)}
            </time>
          )}

          <h1 className="mt-3 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-[#141615]/75">{post.excerpt}</p>
          )}
        </header>

        {post.coverImage?.url && (
          <img
            src={post.coverImage.url}
            srcSet={post.coverImage.srcset || undefined}
            sizes="(min-width: 768px) 48rem, 100vw"
            alt={post.coverImage.alt ?? ''}
            className="mb-10 w-full rounded-2xl"
          />
        )}

        <div
          className="prose-bps text-[#141615]/85"
          // Sanitised server-side by wp_kses on every write. Levels are lifted
          // because the article body follows the post h1 with nothing between.
          dangerouslySetInnerHTML={{ __html: fixHeadingLevels(post.body ?? '', true) }}
        />
      </div>
    </article>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 text-center">
      <p className="font-mono text-xs tracking-wider text-[#84572f] uppercase">404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#141615]">
        That page does not exist
      </h1>
      <p className="mt-4 leading-relaxed text-[#141615]/70">
        The link may be out of date.
      </p>
      <p className="mt-8">
        <Link
          to="/"
          className="inline-flex rounded-full bg-[#84572f] px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#6c4625]"
        >
          Back to the homepage
        </Link>
      </p>
    </div>
  );
}

function formatDate(iso) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content ?? '');
}
