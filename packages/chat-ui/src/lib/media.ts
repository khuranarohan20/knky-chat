/** Resolution badge label (SD/HD/FHD/2K/4K) — ported from the agency getResolution. */
export function getResolution(res?: { width: number; height: number }): string {
  if (!res) return '';
  const L = res.height > res.width ? res.height : res.width;
  if (L >= 3600) return '4K';
  if (L >= 2400) return '2K';
  if (L >= 1700) return 'FHD';
  if (L >= 1100) return 'HD';
  return 'SD';
}
