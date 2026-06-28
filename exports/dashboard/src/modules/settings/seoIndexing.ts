export interface SeoIndexingGuideInput {
  domain: string;
  subdomain: string;
  connectionStatus: string;
}

function normalizeHost(value: string) {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
}

export function resolveSeoSitemapUrl(input: SeoIndexingGuideInput) {
  const preferredHost =
    input.connectionStatus === 'Connected' && normalizeHost(input.domain)
      ? normalizeHost(input.domain)
      : normalizeHost(input.subdomain);

  return `https://${preferredHost}/sitemap.xml`;
}
