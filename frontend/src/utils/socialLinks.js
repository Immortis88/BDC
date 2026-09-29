const SOCIAL_PLATFORMS = new Set(['facebook', 'instagram', 'x', 'youtube']);
const getPlatform = label => {
  const platform = String(label || '').trim().toLowerCase();
  return ['twitter', 'x (twitter)'].includes(platform) ? 'x' : platform;
};

export function normalizeSocialSettings(links) {
  const existing = Array.isArray(links) ? links : [];
  return ['Facebook', 'Instagram', 'X (Twitter)', 'YouTube'].map((label, index) => {
    const item = existing.find(link => getPlatform(link?.label) === getPlatform(label));
    return { ...item, id: item?.id ?? index + 1, label, url: item?.url ?? '', order: index + 1 };
  });
}

export function getSocialLinks(links) {
  if (!Array.isArray(links)) return [];

  return links.flatMap(item => {
    const platform = getPlatform(item?.label);
    const href = typeof (item?.url ?? item?.href) === 'string'
      ? (item.url ?? item.href).trim()
      : '';
    if (!SOCIAL_PLATFORMS.has(platform) || !href) return [];

    try {
      const url = new URL(href);
      if (!['https:', 'http:'].includes(url.protocol)) return [];
      return [{ ...item, platform, href }];
    } catch {
      return [];
    }
  });
}
