import { useState } from 'react';

import { fixHeadingLevels } from '../lib/headings.js';
import { Link } from '../lib/router.jsx';

/**
 * One component per registered section type.
 *
 * They live together because they share a single visual vocabulary: the band,
 * the eyebrow, the heading, the grid. Splitting them across nine files would
 * scatter that vocabulary without making any one of them easier to read.
 *
 * Every class here traces back to Documents/DESIGN-ANALYSIS.md.
 */

/* ------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* ------------------------------------------------------------------------- */

const BAND = {
  cream: 'bg-[#fcf5e9] border-b border-[#84572f]/10',
  pale: 'bg-[#f6f8f5] border-b border-[#84572f]/10',
  dark: 'bg-[#141615] text-white border-b border-white/10',
};

const isDark = (band) => band === 'dark';

/**
 * A section band. `py-20 md:py-28` is the standard rhythm from the analysis.
 */
function Band({ background = 'cream', children, id, wide = false }) {
  return (
    <section id={id} className={`py-20 md:py-28 ${BAND[background] ?? BAND.cream}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${wide ? 'max-w-7xl' : 'max-w-7xl'}`}>
        {children}
      </div>
    </section>
  );
}

/**
 * The small mono label above a heading.
 *
 * The design caps these at one per three sections, which is a page-composition
 * rule rather than something a component can enforce; it renders only when the
 * editor supplied one.
 */
function Eyebrow({ children, dark }) {
  if (!children) {
    return null;
  }

  return (
    <span
      className={[
        'mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5',
        'font-mono text-xs font-semibold tracking-wider uppercase',
        dark
          ? 'border border-[#f1d5a0]/30 bg-white/5 text-[#f1d5a0]'
          : 'border border-[#84572f]/15 bg-[#92ada4]/15 text-[#141615]',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/**
 * Eyebrow, heading and intro: the opening of nearly every section.
 */
function SectionHead({ eyebrow, heading, intro, dark, align = 'center' }) {
  const centred = align === 'center';

  return (
    <div
      data-reveal
      className={`mb-14 md:mb-20 ${centred ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}
    >
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>

      {heading && (
        <h2
          className={`text-3xl font-extrabold tracking-tight text-balance sm:text-5xl ${
            dark ? 'text-white' : 'text-[#141615]'
          }`}
        >
          {heading}
        </h2>
      )}

      {intro && (
        <p
          className={`mt-5 text-lg leading-relaxed ${centred ? 'mx-auto max-w-2xl' : ''} ${
            dark ? 'text-white/80' : 'text-[#141615]/75'
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/**
 * The clay pill. Every button on the site is this shape.
 */
export function Button({ to, children, variant = 'primary', className = '' }) {
  const styles = {
    primary:
      'bg-[#84572f] text-white hover:bg-[#6c4625] shadow-sm hover:shadow hover:-translate-y-0.5',
    secondary:
      'bg-[#92ada4]/15 text-[#84572f] hover:bg-[#92ada4]/25 hover:text-[#141615] border border-[#84572f]/20',
    onDark: 'bg-[#f1d5a0] text-[#141615] hover:bg-[#f1d5a0]/90 shadow-sm hover:-translate-y-0.5',
  };

  return (
    <Link
      to={to}
      // Only the primary action is magnetic. If everything leans toward the
      // cursor, nothing stands out.
      data-magnetic={variant === 'primary' || variant === 'onDark' ? '' : undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3',
        'text-xs font-semibold tracking-wider uppercase whitespace-nowrap',
        'transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]',
        styles[variant] ?? styles.primary,
        className,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

/**
 * Renders a CMS image, or nothing when the field was left empty.
 */
function Img({ image, className, sizes, priority = false, decorative = false }) {
  if (!image?.url) {
    return null;
  }

  return (
    <img
      src={image.url}
      srcSet={image.srcset || undefined}
      sizes={sizes}
      // `decorative` is for an image sitting beside a heading that already says
      // the same thing: a card titled "Event Marketing" next to an image alt'd
      // "Event Marketing img" is announced twice, and the second carries
      // nothing. Alt is still mandatory at write time, so a standalone image
      // always has one.
      alt={decorative ? '' : (image.alt ?? '')}
      width={image.width || undefined}
      height={image.height || undefined}
      /* A lazily-loaded hero is the classic way to lose the LCP metric: the
         browser defers the one image the page is measured on. */
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

/* ------------------------------------------------------------------------- */
/* Section types                                                              */
/* ------------------------------------------------------------------------- */

function Hero({ section }) {
  const { fields, background } = section;
  const dark = isDark(background);

  /*
   * The homepage's hero, applied to every page.
   *
   * Left-aligned rather than centred, because the homepage is and a centred
   * heading beside a left-aligned one reads as a different site. The second
   * headline line carries the sand highlight; the eyebrow gets its rule and
   * note. Each of those is optional, so a page that only ever had a heading
   * still renders as one clean line.
   */
  return (
    <section
      className={`relative overflow-hidden border-b py-20 md:py-28 ${
        dark ? 'border-white/10 bg-[#141615] text-white' : 'border-[#84572f]/10 bg-[#fcf5e9]'
      }`}
    >
      {/* The ambient wash the homepage hero sits on. Decorative only. */}
      <div
        className="pointer-events-none absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-[#f1d5a0]/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 h-96 w-96 rounded-full bg-[#92ada4]/30 blur-3xl"
        aria-hidden="true"
      />

      <div data-reveal className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {fields.eyebrow && (
          <div className="mb-6 flex items-center gap-3">
            <span
              className={`text-xs font-bold tracking-[0.25em] uppercase ${
                dark ? 'text-[#f1d5a0]' : 'text-[#84572f]'
              }`}
            >
              {fields.eyebrow}
            </span>

            {fields.eyebrow_note && (
              <>
                <span
                  className={`h-px w-12 ${dark ? 'bg-white/30' : 'bg-[#84572f]/30'}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs font-medium ${dark ? 'text-white/60' : 'text-[#1c1c1c]/60'}`}
                >
                  {fields.eyebrow_note}
                </span>
              </>
            )}
          </div>
        )}

        <div className="max-w-4xl">
          <h1
            className={`font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl ${
              dark ? 'text-white' : 'text-[#141615]'
            }`}
          >
            <span className="hero-line">
              <span>{fields.heading}</span>
            </span>

            {fields.heading_accent && (
              <>
                <br />
                <span className="hero-line">
                  {/*
                    The highlight is a bar behind the text rather than a
                    text-decoration, so it keeps its weight at display sizes
                    and does not move with the baseline.
                  */}
                  <span className="relative inline-block text-[#84572f]">
                    {fields.heading_accent}
                    <span
                      className="absolute bottom-1 left-0 -z-10 h-2 w-full rounded-sm bg-[#f1d5a0]/60"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </>
            )}
          </h1>

          {fields.subtext && (
            <p
              className={`mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl ${
                dark ? 'text-white/80' : 'text-[#1c1c1c]/80'
              }`}
            >
              {fields.subtext}
            </p>
          )}

          {fields.script_accent && (
            <p
              className={`font-script mt-2 text-xl sm:text-2xl ${
                dark ? 'text-[#f1d5a0]' : 'text-[#84572f]'
              }`}
            >
              {fields.script_accent}
            </p>
          )}
        </div>

        {(fields.primary_cta || fields.secondary_cta) && (
          <div className="mt-10 flex flex-col items-stretch gap-4 pt-4 sm:flex-row sm:items-center sm:gap-6">
            {fields.primary_cta && (
              <Button to={fields.primary_cta.url} variant={dark ? 'onDark' : 'primary'}>
                {fields.primary_cta.label}
              </Button>
            )}

            {fields.secondary_cta && (
              <Button to={fields.secondary_cta.url} variant="secondary">
                {fields.secondary_cta.label}
              </Button>
            )}
          </div>
        )}

        {fields.image && (
          <div className="mt-14">
            <Img
              image={fields.image}
              sizes="(min-width: 1024px) 80rem, 100vw"
              priority
              className="rounded-2xl shadow-xl"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function RichText({ section }) {
  const { fields, background } = section;
  const dark = isDark(background);

  return (
    <Band background={background}>
      <div className="mx-auto max-w-3xl">
        {(fields.eyebrow || fields.heading) && (
          <SectionHead
            eyebrow={fields.eyebrow}
            heading={fields.heading}
            dark={dark}
            align="left"
          />
        )}

        <div
          data-reveal
          className={`prose-bps ${dark ? 'on-dark text-white/85' : 'text-[#141615]/85'}`}
          // The server runs this through wp_kses with a narrow allowlist on
          // every write, so what reaches here cannot carry script or styling.
          dangerouslySetInnerHTML={{
            // With no section heading above it, the body's h3s would follow the
            // page h1 directly and skip a level.
            __html: fixHeadingLevels(fields.body ?? '', !fields.heading),
          }}
        />
      </div>
    </Band>
  );
}

function FeatureList({ section }) {
  const { fields, background } = section;
  const dark = isDark(background);
  const items = fields.items ?? [];

  return (
    <Band background={background}>
      <SectionHead
        eyebrow={fields.eyebrow}
        heading={fields.heading}
        intro={fields.intro}
        dark={dark}
      />

      <ul data-reveal data-reveal-stagger className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={index}
            className={`rounded-2xl border p-6 ${
              dark ? 'border-white/10 bg-white/5' : 'border-[#84572f]/10 bg-white shadow-sm'
            }`}
          >
            <h3
              className={`text-lg font-extrabold tracking-tight ${
                dark ? 'text-white' : 'text-[#141615]'
              }`}
            >
              {item.title}
            </h3>
            {item.body && (
              <p
                className={`mt-2 leading-relaxed ${dark ? 'text-white/75' : 'text-[#141615]/70'}`}
              >
                {item.body}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Band>
  );
}

function IntroGrid({ section }) {
  const { fields, background, resolved } = section;
  const dark = isDark(background);
  const items = resolved?.items_source ?? [];
  const columns = fields.columns ?? '3';

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  /*
   * Five items in a three-column grid leaves a two-card stub on the last row,
   * which reads as a mistake rather than a layout. Widening the first card
   * absorbs the remainder: 5 becomes a 2-wide lead plus a full row of three.
   * Only kicks in when the remainder is exactly the awkward case.
   */
  const span = Number(columns) > 1 && items.length % Number(columns) === 2;

  return (
    <Band background={background}>
      <SectionHead
        eyebrow={fields.eyebrow}
        heading={fields.heading}
        intro={fields.intro}
        dark={dark}
      />

      <div data-reveal data-reveal-stagger className={`grid gap-8 ${gridCols[columns] ?? gridCols[3]}`}>
        {items.map((item, index) => (
          <article
            key={item.id}
            id={item.anchorId || undefined}
            // `group` is the core hover pattern: the whole card is the target.
            className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
              span && index === 0 ? 'lg:col-span-2' : ''
            } ${
              dark
                ? 'border-white/10 bg-white/5 hover:border-[#f1d5a0]/40'
                : 'border-[#84572f]/10 bg-white shadow-sm hover:shadow-xl'
            }`}
          >
            {item.coverImage && (
              <div className="card-media aspect-[760/520] overflow-hidden">
                <Img
                  image={item.coverImage}
                  sizes="(min-width: 1024px) 24rem, 100vw"
                  decorative
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            )}

            <div className="p-6">
              <h3
                className={`text-lg font-extrabold tracking-tight transition-colors ${
                  dark
                    ? 'text-white group-hover:text-[#f1d5a0]'
                    : 'text-[#141615] group-hover:text-[#84572f]'
                }`}
              >
                {item.title}
              </h3>

              {(item.summary || item.excerpt || item.quote) && (
                <p
                  className={`mt-2 leading-relaxed ${dark ? 'text-white/75' : 'text-[#141615]/70'}`}
                >
                  {item.summary || item.excerpt || item.quote}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {fields.footer_cta && (
        <div className="mt-14 text-center">
          <Button to={fields.footer_cta.url} variant={dark ? 'onDark' : 'primary'}>
            {fields.footer_cta.label}
          </Button>
        </div>
      )}
    </Band>
  );
}

function StatRow({ section }) {
  const { fields, background } = section;
  const dark = isDark(background);
  const stats = fields.stats ?? [];

  return (
    <Band background={background}>
      {(fields.eyebrow || fields.heading) && (
        <SectionHead eyebrow={fields.eyebrow} heading={fields.heading} dark={dark} />
      )}

      <dl data-reveal data-reveal-stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-6 text-center ${
              dark ? 'border-white/10 bg-white/5' : 'border-[#84572f]/10 bg-white shadow-sm'
            }`}
          >
            {/* tabular-nums keeps the figures aligned across the row. */}
            <dt className="sr-only">{stat.label}</dt>
            <dd
              className={`font-mono text-2xl font-extrabold tabular-nums sm:text-3xl ${
                dark ? 'text-[#f1d5a0]' : 'text-[#84572f]'
              }`}
            >
              {stat.value}
            </dd>
            <p
              className={`mt-1.5 text-sm ${dark ? 'text-white/70' : 'text-[#141615]/65'}`}
              aria-hidden="true"
            >
              {stat.label}
            </p>
          </div>
        ))}
      </dl>
    </Band>
  );
}

function TestimonialSet({ section }) {
  const { fields, background, resolved } = section;
  const dark = isDark(background);
  const items = resolved?.items_source ?? [];

  return (
    <Band background={background}>
      <SectionHead
        eyebrow={fields.eyebrow}
        heading={fields.heading}
        intro={fields.intro}
        dark={dark}
      />

      <div data-reveal data-reveal-stagger className="grid gap-8 md:grid-cols-2">
        {items.map((item) => (
          <figure
            key={item.id}
            className={`flex flex-col rounded-2xl border p-7 ${
              dark ? 'border-white/10 bg-white/5' : 'border-[#84572f]/10 bg-white shadow-sm'
            }`}
          >
            <blockquote
              className={`flex-1 text-lg leading-relaxed ${
                dark ? 'text-white/85' : 'text-[#141615]/80'
              }`}
            >
              {/* Typographic quotes, not straight ASCII. */}
              &ldquo;{item.quote}&rdquo;
            </blockquote>

            <figcaption
              className={`mt-5 border-t pt-4 text-sm ${
                dark ? 'border-white/10 text-white/70' : 'border-[#84572f]/10 text-[#141615]/65'
              }`}
            >
              <span className="font-semibold">{item.author}</span>
              {item.role && <span> - {item.role}</span>}
              {item.company && <span>, {item.company}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Band>
  );
}

function CtaBand({ section }) {
  const { fields, background } = section;
  const dark = isDark(background);

  return (
    <section
      className={`relative overflow-hidden py-24 md:py-32 ${
        dark ? 'bg-[#0e100f] text-white' : 'bg-[#f6f8f5]'
      }`}
    >
      <div data-reveal className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          className={`text-3xl font-extrabold tracking-tight text-balance sm:text-5xl ${
            dark ? 'text-white' : 'text-[#141615]'
          }`}
        >
          {fields.heading}
        </h2>

        {fields.body && (
          <p
            className={`mx-auto mt-5 max-w-2xl text-lg leading-relaxed ${
              dark ? 'text-white/80' : 'text-[#141615]/75'
            }`}
          >
            {fields.body}
          </p>
        )}

        {fields.primary_cta && (
          <div className="mt-9">
            <Button to={fields.primary_cta.url} variant={dark ? 'onDark' : 'primary'}>
              {fields.primary_cta.label}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function CaseStudyGrid({ section }) {
  const { fields, background, resolved } = section;
  const dark = isDark(background);
  const items = resolved?.items_source ?? [];

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];

  return (
    <Band background={background}>
      <SectionHead
        eyebrow={fields.eyebrow}
        heading={fields.heading}
        intro={fields.intro}
        dark={dark}
      />

      {fields.show_filters && categories.length > 1 && (
        <CategoryFilter categories={categories} items={items} dark={dark} columns={fields.columns} />
      )}

      {(!fields.show_filters || categories.length <= 1) && (
        <CaseStudyCards items={items} dark={dark} columns={fields.columns} />
      )}
    </Band>
  );
}

/**
 * Filter chips over the case-study grid.
 *
 * Real buttons with `aria-pressed`, so the active filter is announced rather
 * than only coloured in.
 */
function CategoryFilter({ categories, items, dark, columns }) {
  const [active, setActive] = useState('all');

  const shown = active === 'all' ? items : items.filter((item) => item.category === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {['all', ...categories].map((category) => {
          const selected = active === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              aria-pressed={selected}
              className={[
                'rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                selected
                  ? 'bg-[#84572f] text-white'
                  : dark
                    ? 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    : 'border border-[#84572f]/15 bg-[#92ada4]/15 text-[#141615] hover:bg-[#92ada4]/25',
              ].join(' ')}
            >
              {category === 'all' ? 'All work' : category}
            </button>
          );
        })}
      </div>

      <CaseStudyCards items={shown} dark={dark} columns={columns} />
    </>
  );
}

function CaseStudyCards({ items, dark, columns = '3' }) {
  if (items.length === 0) {
    return (
      <p className={`py-16 text-center ${dark ? 'text-white/70' : 'text-[#141615]/60'}`}>
        Nothing to show here yet.
      </p>
    );
  }

  // Column count is a field, so a page can vary it. The homepage runs these
  // two-up precisely so it does not look like the three-up services grid
  // directly above it.
  const cols = columns === '2' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <div data-reveal data-reveal-stagger className={`grid gap-8 ${cols}`}>
      {items.map((item) => (
        <article
          key={item.id}
          className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
            dark
              ? 'border-white/10 bg-white/5 hover:border-[#f1d5a0]/40'
              : 'border-[#84572f]/10 bg-white shadow-sm hover:shadow-xl'
          }`}
        >
          {item.coverImage && (
            <div className="card-media aspect-[760/520] overflow-hidden">
              <Img
                image={item.coverImage}
                sizes="(min-width: 1024px) 24rem, 100vw"
                decorative
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          )}

          <div className="p-6">
            {item.client && (
              <p
                className={`font-mono text-xs tracking-wider uppercase ${
                  dark ? 'text-[#f1d5a0]' : 'text-[#84572f]'
                }`}
              >
                {item.client}
              </p>
            )}

            <h3
              className={`mt-1.5 text-lg font-extrabold tracking-tight transition-colors ${
                dark
                  ? 'text-white group-hover:text-[#f1d5a0]'
                  : 'text-[#141615] group-hover:text-[#84572f]'
              }`}
            >
              {/*
                The whole card is the hover target, but only the title is the
                link. A card-sized anchor would swallow any other control and
                read as one enormous link name to a screen reader.
              */}
              <Link to={`/our-work/${item.slug}/`} className="no-underline">
                {item.title}
              </Link>
            </h3>

            {item.summary && (
              <p className={`mt-2 leading-relaxed ${dark ? 'text-white/75' : 'text-[#141615]/70'}`}>
                {item.summary}
              </p>
            )}

            {item.metrics?.length > 0 && (
              <dl className="mt-5 flex flex-wrap gap-4 border-t border-current/10 pt-4">
                {item.metrics.map((metric, index) => (
                  <div key={index}>
                    <dt className="sr-only">{metric.label}</dt>
                    <dd
                      className={`font-mono text-lg font-extrabold tabular-nums ${
                        dark ? 'text-[#f1d5a0]' : 'text-[#84572f]'
                      }`}
                    >
                      {metric.value}
                    </dd>
                    <p
                      className={`text-xs ${dark ? 'text-white/60' : 'text-[#141615]/55'}`}
                      aria-hidden="true"
                    >
                      {metric.label}
                    </p>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export { Band, SectionHead, Eyebrow, Img };

/**
 * The map the renderer uses. A section type with no entry renders nothing
 * rather than crashing the page.
 */
export const SECTION_COMPONENTS = {
  hero: Hero,
  rich_text: RichText,
  feature_list: FeatureList,
  intro_grid: IntroGrid,
  stat_row: StatRow,
  testimonial_set: TestimonialSet,
  cta_band: CtaBand,
  case_study_grid: CaseStudyGrid,
};
