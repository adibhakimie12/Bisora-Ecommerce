export function buildRobotsTxt({
  siteUrl,
  additionalAllow = [],
  additionalDisallow = [],
}: {
  siteUrl: string;
  additionalAllow?: string[];
  additionalDisallow?: string[];
}) {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const allowRules = ['/products/', '/collections/', '/pages/', ...additionalAllow];
  const disallowRules = ['/admin', '/checkout', '/cart', '/__internal/', '/system/', ...additionalDisallow];

  return [
    'User-agent: *',
    ...allowRules.map((rule) => `Allow: ${normalizeRule(rule)}`),
    ...disallowRules.map((rule) => `Disallow: ${normalizeRule(rule)}`),
    `Sitemap: ${cleanSiteUrl}/sitemap.xml`,
  ].join('\n');
}

function normalizeRule(value: string) {
  return value.startsWith('/') ? value : `/${value}`;
}
