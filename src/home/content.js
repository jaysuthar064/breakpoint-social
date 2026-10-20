/**
 * Homepage content: the editable copy, and where it comes from.
 *
 * The homepage was ported from a standalone app with every string written into
 * the JSX. This module lifts those strings out so the CMS can own them, while
 * keeping them as the defaults.
 *
 * That fallback is the whole design. An empty CMS renders the page exactly as
 * the original did, so wiring a field up is never a risk: the worst case is the
 * copy that is already there. It also means the homepage still renders when
 * WordPress is unreachable, which a homepage has to do.
 *
 * Only text is editable. Icons, colours, gradients and layout stay in the
 * components, because the brief was that the design match the original exactly
 * and an editor cannot be given the means to break it.
 */

export const HOME_DEFAULTS = {
  announcement: {
    text: 'Breakpoint Social · San Diego Social Media Agency — Client Case Studies & Campaign Showcase',
  },

  hero: {
    eyebrow: 'OUR WORK',
    eyebrow_note: 'Portfolio & Case Studies',
    heading: 'Creative Campaigns.',
    heading_accent: 'Real Impact.',
    subtext:
      'Explore the creative campaigns, influencer collaborations, and social strategies we’ve brought to life for our partners.',
    script_line: 'From perfection to personality — social movements, not just posts.',
    primary_label: 'Explore Our Work',
    secondary_label: 'Featured Case Study',
    trust: [
      {
        title: 'Verified Campaign Data',
        body: 'Strict adherence to verified client outcomes without fabricated vanity metrics.',
      },
      {
        title: 'Creator-First Strategy',
        body: 'Partnering with vetted tastemakers and cultural voices for authentic traction.',
      },
      {
        title: 'San Diego Agency Roots',
        body: 'Founded by Taylor and Nick with over two decades of combined social leadership.',
      },
    ],
  },

  results: {
    badge: 'VERIFIED PERFORMANCE DATA',
    heading: 'RESULTS THAT SPEAK FOR THEMSELVES',
    tagline: 'Real Content. Real Reach. Real Growth.',
    intro: 'Selected results generated across Breakpoint Social client accounts.',
    stats: [
      { value: '1.3M+', label: 'ORGANIC VIEWS', context: 'in 30 days', badge: 'Total Reach', icon: 'Eye' },
      { value: '+631', label: 'NEW FOLLOWERS', context: 'in 30 days', badge: 'Audience Growth', icon: 'Users' },
      { value: '139K+', label: 'CONTENT VIEWS', context: 'in 30 days', badge: 'Consistent Volume', icon: 'PlayCircle' },
      { value: '12K+', label: 'INTERACTIONS', context: 'in 30 days', badge: 'High Engagement', icon: 'HeartHandshake' },
      {
        value: '89%',
        label: 'NON-FOLLOWER VIEWS',
        context: 'reaching new audiences',
        badge: 'Organic Discovery',
        icon: 'Globe',
      },
      {
        value: '57K+',
        label: 'VIEWS',
        context: 'on a single piece of content',
        badge: 'Viral Spike',
        icon: 'Zap',
      },
    ],
    callout_heading: 'We build content that gets brands noticed.',
    callout_body:
      'From social strategy and content creation to influencer marketing, Breakpoint Social helps brands reach new audiences, build awareness, and turn attention into growth.',
    callout_label: 'SEE WHAT BREAKPOINT CAN DO FOR YOUR BRAND',
  },

  cta: {
    eyebrow: 'START A CONVERSATION',
    heading: 'Let’s Create Something',
    heading_script: 'worth talking about.',
    subtext:
      'Have a brand, campaign, or collaboration in mind? Let’s explore what we can create together.',
    primary_label: 'Let’s Work Together',
    secondary_cta: { label: 'Visit Contact Page', url: '/contact-us/' },
    cards: [
      {
        name: 'Taylor · Co-Founder',
        role: 'Influencer & Strategy',
        email: 'taylor@breakpointsocial.com',
        phone: '+1 (818) 312-5428',
        note: '',
        footnote: '',
      },
      {
        name: 'Nick Toth · Co-Founder',
        role: 'Campaigns & Production',
        email: 'nick.toth@breakpointsocial.com',
        phone: '+1 (310) 775-3944',
        note: '',
        footnote: '',
      },
      {
        name: 'Location & Presence',
        role: 'San Diego, California',
        email: '',
        phone: '',
        note: 'San Diego Social Media Agency',
        footnote: 'Available for brand partnerships nationwide.',
      },
    ],
  },
};

/**
 * Which CMS section type feeds which part of the page.
 */
const SECTION_MAP = {
  home_announcement: 'announcement',
  home_hero: 'hero',
  home_results: 'results',
  home_cta: 'cta',
};

/**
 * True for a value an editor has actually filled in.
 *
 * An empty string, a missing key and an empty repeater all mean "not set", and
 * all have to fall through to the default rather than blanking the page. This
 * is why `??` alone is not enough: the CMS returns '' for a cleared text field,
 * which is not nullish but is still nothing.
 */
function isSet(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return true;
}

/**
 * Overlays the editor's values on the defaults, one level deep.
 *
 * Repeaters are replaced wholesale rather than merged item by item: an editor
 * who removes the third trust point means to have two, and merging would put
 * the deleted one back.
 */
function overlay(defaults, fields) {
  if (!fields) {
    return defaults;
  }

  const out = { ...defaults };

  for (const [key, value] of Object.entries(fields)) {
    if (!(key in defaults)) {
      continue;
    }

    if (isSet(value)) {
      out[key] = value;
    }
  }

  return out;
}

/**
 * The homepage's content, from the CMS where it is set and the defaults elsewhere.
 *
 * @param {object|null} snapshot The `/snapshot` payload, or null when there is none.
 */
export function homeContent(snapshot) {
  const sections = snapshot?.pages?.['']?.sections ?? [];

  const content = {
    announcement: HOME_DEFAULTS.announcement,
    hero: HOME_DEFAULTS.hero,
    results: HOME_DEFAULTS.results,
    cta: HOME_DEFAULTS.cta,
  };

  for (const section of sections) {
    const slot = SECTION_MAP[section?.type];

    if (slot) {
      content[slot] = overlay(HOME_DEFAULTS[slot], section.fields);
    }
  }

  return content;
}
