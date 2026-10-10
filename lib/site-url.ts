/** Resolve the deployment origin separately from the public canonical origin. */
export function resolveSiteUrl({ explicitUrl, vercelUrl, vercelEnvironment, productionUrl }: {
  explicitUrl?: string; vercelUrl?: string; vercelEnvironment?: string; productionUrl: string;
}) {
  // A production-only setting accidentally shared with previews must not index them.
  if (vercelEnvironment === "preview") return vercelUrl ? `https://${vercelUrl}` : "http://localhost:8100";
  return explicitUrl || (vercelEnvironment === "production" ? productionUrl : undefined)
    || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:8100");
}

export function isProductionUrl(resolvedUrl: string, productionUrl: string) {
  try {
    const url = new URL(resolvedUrl);
    return url.protocol === "https:" && url.host === new URL(productionUrl).host;
  } catch {
    return false;
  }
}
