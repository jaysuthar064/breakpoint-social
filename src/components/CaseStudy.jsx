import { useEffect, useRef, useState } from 'react';

import { Link } from '../lib/router.jsx';
import { Button } from './sections.jsx';

/**
 * A single case study.
 *
 * The grid cards only ever showed a summary and the headline metrics, which
 * left `objective` and `approach` written into the CMS and rendered nowhere.
 * This is the page that content was always for.
 */
export function CaseStudy({ study, others }) {
  return (
    <>
      <header className="border-b border-[#84572f]/10 bg-[#fcf5e9] py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/our-work/"
            className="link-underline mb-8 inline-block text-sm text-[#141615]/60 transition-colors hover:text-[#84572f]"
          >
            All work
          </Link>

          <div data-reveal>
            {study.client && (
              <p className="font-mono text-xs tracking-wider text-[#84572f] uppercase">
                {study.client}
              </p>
            )}

            <h1 className="mt-3 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl lg:text-6xl">
              {study.title}
            </h1>

            {study.summary && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#141615]/75">
                {study.summary}
              </p>
            )}

            {study.category && (
              <p className="mt-6">
                <span className="inline-flex rounded-full border border-[#84572f]/15 bg-[#92ada4]/15 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-[#141615] uppercase">
                  {study.category}
                </span>
              </p>
            )}
          </div>
        </div>
      </header>

      {study.coverImage?.url && (
        <div className="bg-[#fcf5e9]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <img
              src={study.coverImage.url}
              srcSet={study.coverImage.srcset || undefined}
              sizes="(min-width: 1024px) 64rem, 100vw"
              alt={study.coverImage.alt ?? ''}
              width={study.coverImage.width || undefined}
              height={study.coverImage.height || undefined}
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      )}

      {study.metrics?.length > 0 && (
        <section className="border-b border-white/10 bg-[#141615] py-16 text-white md:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="mb-8 text-center font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase">
              Verified performance data
            </p>

            <dl
              data-reveal
              data-reveal-stagger
              className="grid grid-cols-2 gap-6 sm:grid-cols-3"
            >
              {study.metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <dt className="sr-only">{metric.label}</dt>
                  <dd className="font-mono text-3xl font-extrabold tabular-nums text-[#f1d5a0] sm:text-4xl">
                    <CountUp value={metric.value} />
                  </dd>
                  <p className="mt-2 text-sm text-white/70" aria-hidden="true">
                    {metric.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {(study.objective || study.approach) && (
        <section className="border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28">
          <div className="mx-auto grid max-w-5xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {study.objective && (
              <div data-reveal>
                <h2 className="mb-4 font-mono text-xs font-semibold tracking-wider text-[#84572f] uppercase">
                  The objective
                </h2>
                <p className="text-lg leading-relaxed text-[#141615]/80">{study.objective}</p>
              </div>
            )}

            {study.approach && (
              <div data-reveal>
                <h2 className="mb-4 font-mono text-xs font-semibold tracking-wider text-[#84572f] uppercase">
                  Our approach
                </h2>
                <p className="text-lg leading-relaxed text-[#141615]/80">{study.approach}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {study.deliverables?.length > 0 && (
        <section className="border-b border-[#84572f]/10 bg-[#fcf5e9] py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#141615] sm:text-4xl">
              Creative deliverables
            </h2>

            <div
              data-reveal
              data-reveal-stagger
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {study.deliverables.map((item, index) => (
                <article
                  key={index}
                  className="group overflow-hidden rounded-2xl border border-[#84572f]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {item.image?.url && (
                    <div className="aspect-[760/520] overflow-hidden">
                      <img
                        src={item.image.url}
                        alt=""
                        loading="lazy"
                        width={item.image.width || undefined}
                        height={item.image.height || undefined}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-extrabold tracking-tight text-[#141615]">
                      {item.title}
                    </h3>
                    {item.body && (
                      <p className="mt-2 leading-relaxed text-[#141615]/70">{item.body}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {study.gallery?.length > 0 && (
        <section className="border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul data-reveal data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {study.gallery.map((image, index) => (
                <li key={index} className="overflow-hidden rounded-2xl">
                  <img
                    src={image.url}
                    alt={image.alt ?? ''}
                    loading="lazy"
                    width={image.width || undefined}
                    height={image.height || undefined}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {others?.length > 0 && (
        <section className="bg-[#fcf5e9] py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-2xl font-extrabold tracking-tight text-[#141615]">
              More work
            </h2>

            <div data-reveal data-reveal-stagger className="grid gap-8 md:grid-cols-3">
              {others.map((other) => (
                <Link
                  key={other.id}
                  to={`/our-work/${other.slug}/`}
                  className="group block rounded-2xl border border-[#84572f]/10 bg-white p-6 no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {other.client && (
                    <span className="font-mono text-xs tracking-wider text-[#84572f] uppercase">
                      {other.client}
                    </span>
                  )}
                  <span className="mt-1.5 block text-lg font-extrabold tracking-tight text-[#141615] transition-colors group-hover:text-[#84572f]">
                    {other.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#0e100f] py-24 text-white md:py-32">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Want results like these?
          </h2>
          <div className="mt-9">
            <Button to="/contact-us/" variant="onDark">
              Get in touch
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Counts a metric up when it first comes into view.
 *
 * Motivated, not decorative: on a case study the numbers are the evidence, and
 * movement puts the eye on them. It only runs once, and only for values it can
 * parse, so "3.2x" and "+631" animate while anything unexpected is printed
 * as-is rather than mangled.
 */
function CountUp({ value }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;

    if (!node || typeof window === 'undefined') {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    // Split "139K+" into prefix, number and suffix so the shape is preserved.
    const match = String(value).match(/^([^\d.]*)([\d.]+)(.*)$/);

    if (!match || !('IntersectionObserver' in window)) {
      return undefined;
    }

    const [, prefix, numberText, suffix] = match;
    const target = parseFloat(numberText);
    const decimals = (numberText.split('.')[1] ?? '').length;

    if (!Number.isFinite(target)) {
      return undefined;
    }

    let frame = 0;
    let start = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          return;
        }

        observer.disconnect();

        const step = (now) => {
          if (!start) {
            start = now;
          }

          // 900ms feels deliberate without making the reader wait.
          const progress = Math.min((now - start) / 900, 1);
          // Ease out: fast at first, settling at the end.
          const eased = 1 - Math.pow(1 - progress, 3);

          setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);

          if (progress < 1) {
            frame = requestAnimationFrame(step);
          }
        };

        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  // The real value is always in the DOM for assistive tech and for the
  // prerendered HTML; only the visible text animates.
  return (
    <span ref={ref}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
