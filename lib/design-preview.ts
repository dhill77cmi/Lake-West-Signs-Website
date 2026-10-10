/** Design comparisons are available only on a local development build. */
export function isDesignPreview(): boolean {
  return process.env.NODE_ENV === "development" && typeof window !== "undefined" && (
    window.location.pathname.startsWith("/design-options/") ||
    new URLSearchParams(window.location.search).get("review") === "1"
  );
}
