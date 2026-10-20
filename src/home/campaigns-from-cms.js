/**
 * Maps the CMS `campaign` collection onto the shapes the homepage renders.
 *
 * The homepage was built against hardcoded data in `data/campaigns.ts`. Rather
 * than rewrite its components to a new shape -- which would mean touching the
 * markup that has to stay identical to the original -- this translates the CMS
 * payload into the shape they already expect.
 *
 * Returns null, not an empty array, when the CMS has no campaigns. The caller
 * needs to tell "the editor has not imported anything yet" apart from "the
 * editor deliberately has no campaigns", and only the first should fall back to
 * the bundled data.
 */

/**
 * A media row from the CMS, as one of his `CampaignMediaItem`s.
 */
function toMediaItem(row, campaignId, index) {
  const poster = row.poster?.url ?? '';

  // Only the fields that were actually filled in: an analytics object full of
  // empty strings renders as a row of blank stat boxes rather than as nothing.
  const analytics = {};

  for (const key of [
    'views',
    'viewsContext',
    'nonFollowerReach',
    'interactions',
    'followersGained',
    'highlight',
  ]) {
    if (row[key]) {
      analytics[key] = row[key];
    }
  }

  return {
    id: `${campaignId}-media-${index}`,
    type: row.videoUrl ? 'video' : 'image',
    title: row.title ?? '',
    aspectRatio: row.aspectRatio || '9:16',
    src: poster,
    videoUrl: row.videoUrl || undefined,
    posterUrl: poster,
    poster,
    talent: row.talent || undefined,
    format: row.format || undefined,
    description: row.description || undefined,
    externalUrl: row.externalUrl || undefined,
    analytics: Object.keys(analytics).length > 0 ? analytics : undefined,
  };
}

/**
 * One CMS item as one of his `Campaign`s.
 */
function toCampaign(item) {
  const media = Array.isArray(item.media) ? item.media : [];
  const mediaGallery = media.map((row, index) => toMediaItem(row, item.id, index));

  // The card image, falling back to the first piece of media rather than
  // leaving a hole in the grid.
  const thumbnailUrl = item.thumbnail?.url ?? mediaGallery[0]?.posterUrl ?? '';

  return {
    id: String(item.id),
    brand: item.brand ?? '',
    title: item.title ?? '',
    category: item.category ?? 'Creative Production',
    isFeatured: Boolean(item.isFeatured),
    collaboratorNames: (item.collaborators ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
    shortDescription: item.shortDescription ?? '',
    fullDescription: item.fullDescription ?? item.shortDescription ?? '',
    objective: item.objective || undefined,
    creativeApproach: item.creativeApproach || undefined,
    servicesProvided: (Array.isArray(item.services) ? item.services : [])
      .map((row) => row.label)
      .filter(Boolean),
    mediaGallery,
    thumbnail: {
      type: thumbnailUrl ? 'image' : 'placeholder',
      aspectRatio: '9:16',
      src: thumbnailUrl,
      isPlaceholder: !thumbnailUrl,
      placeholderLabel: thumbnailUrl ? undefined : item.brand,
    },
    metrics: (Array.isArray(item.metrics) ? item.metrics : []).map((metric) => ({
      label: metric.label ?? '',
      value: metric.value ?? '',
      context: metric.context || undefined,
      // Absent means not verified. A missing flag must never read as verified.
      isVerified: Boolean(metric.isVerified),
    })),
    // Only published campaigns are in the public snapshot at all, so anything
    // that reaches here is published by definition.
    publicationStatus: 'published',
    displayOrder: Number(item.order ?? 0),
  };
}

/**
 * The CMS's campaigns, or null when it has none.
 *
 * @param {object|null} snapshot The `/snapshot` payload.
 */
export function campaignsFromCms(snapshot) {
  const items = snapshot?.collections?.campaign;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items
    .map(toCampaign)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
