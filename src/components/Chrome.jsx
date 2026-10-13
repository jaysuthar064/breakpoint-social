import { useEffect, useState } from 'react';

import { Link, useRouter } from '../lib/router.jsx';

/**
 * Header, footer and the skip link: everything that wraps every page.
 */

const CONTACT = {
  taylor: { name: 'Taylor', phone: '+1 (818) 312-5428', email: 'taylor@breakpointsocial.com' },
  nick: { name: 'Nick Toth', phone: '+1 (310) 775-3944', email: 'nick.toth@breakpointsocial.com' },
};

const SOCIAL = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@breakpointsocial' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/breakpointsocial' },
  { label: 'Instagram', href: 'https://www.instagram.com/breakpointsocial' },
];

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-full bg-[#84572f] px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
    >
      Skip to content
    </a>
  );
}

export function Header({ nav, branding }) {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation, or it stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const items = nav ?? [];

  return (
    <header className="sticky top-0 z-40 border-b border-[#84572f]/10 bg-[#fcf5e9]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Breakpoint Social, home">
          {branding?.logo?.url ? (
            /*
             * Darkened with a filter rather than used as supplied.
             *
             * Both logo files available are light-ink artwork drawn for a dark
             * background: the sand wordmark measures 1.36:1 against the cream
             * header, which is invisible. brightness(0.4) brings it to a deep
             * brown at 6.9:1 while keeping the warm brand tone.
             *
             * An earlier attempt used a CSS mask to recolour it exactly. That
             * looked right in theory and rendered nothing: a <span> with
             * `w-auto` inside a flex row has no content, so it collapsed to
             * zero width. An <img> carries its own intrinsic dimensions and
             * cannot collapse, which matters more here than exact hue.
             *
             * Replace this with a proper dark-ink logo via Headless CMS >
             * Settings and the filter can go.
             */
            <img
              src={branding.logo.url}
              /* The link already names the destination; alt here would repeat it. */
              alt=""
              width={branding.logo.width || undefined}
              height={branding.logo.height || undefined}
              /* Above the fold on every route, so it is the LCP candidate. */
              loading="eager"
              fetchPriority="high"
              style={{ filter: 'brightness(0.4) saturate(1.15)' }}
              className="h-9 w-auto shrink-0 transition-opacity duration-200 hover:opacity-80"
            />
          ) : (
            <span className="font-display text-lg font-extrabold tracking-tight text-[#141615]">
              Breakpoint Social
            </span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {items.map((item) => {
            const current = path === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                aria-current={current ? 'page' : undefined}
                className={[
                  'rounded-full px-3.5 py-2 text-sm transition-colors duration-200',
                  current
                    ? 'font-semibold text-[#84572f]'
                    : 'text-[#141615]/75 hover:text-[#84572f]',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            to="/contact-us/"
            className="ml-2 inline-flex items-center rounded-full bg-[#84572f] px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6c4625]"
          >
            Get in touch
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          // min-h-11 is 44px: the floor for a touch target. py-2 alone left
          // this at roughly 38px, which is a miss-tap waiting to happen.
          className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-[#141615] lg:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-[#84572f]/10 bg-[#fcf5e9] px-4 pb-4 lg:hidden"
        >
          <ul className="flex flex-col gap-0.5 pt-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  aria-current={path === item.path ? 'page' : undefined}
                  className={[
                    // min-h-11 is the 44px touch-target floor.
                    'flex min-h-11 items-center rounded-lg px-3 py-2.5 text-base',
                    path === item.path
                      ? 'bg-[#f1d5a0]/30 font-semibold text-[#84572f]'
                      : 'text-[#1c1c1c] hover:bg-[#92ada4]/15',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Footer({ nav, branding }) {
  const items = nav ?? [];

  return (
    <footer className="bg-[#141615] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 border-b border-neutral-800 pb-16 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            {branding?.logo?.url ? (
              <img
                src={branding.logoDark?.url ?? branding.logo.url}
                alt="Breakpoint Social"
                /* Declared so the footer does not reflow when the logo loads. */
                width={(branding.logoDark ?? branding.logo).width || undefined}
                height={(branding.logoDark ?? branding.logo).height || undefined}
                /*
                 * The filter is only for the fallback. `logoDark` is already the
                 * light-ink artwork made for a dark background; inverting it
                 * would turn it black and hide it against the footer, which is
                 * the same mistake that made the header logo invisible.
                 */
                className={`h-10 w-auto ${branding.logoDark ? '' : 'brightness-0 invert'}`}
              />
            ) : (
              <p className="font-display text-xl font-extrabold tracking-tight">Breakpoint Social</p>
            )}
            <p className="mt-3 max-w-sm leading-relaxed text-white/70">
              A San Diego social media and influencer marketing agency. We engineer campaigns that
              spark movements, not just posts.
            </p>

            <ul className="mt-6 flex gap-4">
              {SOCIAL.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-sm text-white/70 underline-offset-4 transition-colors hover:text-[#f1d5a0] hover:underline"
                  >
                    {social.label}
                    {/* A link that opens a new tab should say so: sighted users
                        see it happen, screen reader users get no cue. */}
                    <span className="sr-only"> (opens in a new window)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase">
              Explore
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className="text-sm text-white/70 transition-colors hover:text-[#f1d5a0]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase">
              Contact
            </h2>
            <ul className="mt-4 flex flex-col gap-4 text-sm text-white/70">
              {Object.values(CONTACT).map((person) => (
                <li key={person.email}>
                  <p className="font-semibold text-white">{person.name}</p>
                  <a
                    href={`tel:${person.phone.replace(/[^+\d]/g, '')}`}
                    className="block transition-colors hover:text-[#f1d5a0]"
                  >
                    {person.phone}
                  </a>
                  <a
                    href={`mailto:${person.email}`}
                    className="block break-all transition-colors hover:text-[#f1d5a0]"
                  >
                    {person.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="pt-8 text-xs text-white/50">
          &copy; {new Date().getFullYear()} Breakpoint Social. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
