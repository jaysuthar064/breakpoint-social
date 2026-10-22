/**
 * Maps the CMS `reel` collection onto the shape the reels grid renders.
 *
 * Reels are their own collection rather than being derived from a campaign's
 * media. Nine of the thirty-six reels belong to no campaign at all, so deriving
 * them would have quietly dropped a quarter of the grid.
 *
 * Returns null when the CMS has none, so the caller can tell "nothing imported
 * yet" from "deliberately empty" and fall back to the bundled list only in the
 * first case.
 */

/**
 * The reels the CMS holds, in display order, or null when it holds none.
 *
 * @param {object|null} snapshot The `/snapshot` payload.
 */
export function reelsFromCms(snapshot) {
  const items = snapshot?.collections?.reel;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items
    .map((item) => {
      // Only the figures that were filled in. An analytics object of empty
      // strings renders as a row of blank stat boxes rather than as nothing.
      const analytics = {};

      for (const key of [
        'views',
        'viewsContext',
        'nonFollowerReach',
        'interactions',
        'followersGained',
        'highlight',
      ]) {
        if (item[key]) {
          analytics[key] = item[key];
        }
      }

      const poster = item.poster?.url ?? '';
      // The uploaded file wins over the URL field: one is in the media library
      // and travels with a backup, the other is a path somebody typed.
      const video = item.video?.url || item.videoUrl || '';

      return {
        id: `reel-${item.id}`,
        reelCode: item.reelCode ?? '',
        title: item.title ?? '',
        category: item.category ?? 'Creative Production',
        videoUrl: video,
        posterUrl: poster,
        coverImage: poster,
        talent: item.talent || undefined,
        format: item.format ?? '',
        description: item.description ?? '',
        aspectRatio: item.aspectRatio || '9:16',
        analytics: Object.keys(analytics).length > 0 ? analytics : undefined,
        externalUrl: item.externalUrl || undefined,
        order: Number(item.order ?? 0),
      };
    })
    .sort((a, b) => a.order - b.order);
}
