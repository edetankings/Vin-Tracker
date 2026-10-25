export type AppRelease = { version: string; buildId: string; builtAt: string };
export const UPDATE_POLL_MS = 60_000;

export function parseAppRelease(value: unknown): AppRelease {
  if (!value || typeof value !== "object") throw new Error("Update information is unavailable.");
  const release = value as Record<string, unknown>;
  if (
    typeof release["version"] !== "string" ||
    !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(release["version"]) ||
    typeof release["buildId"] !== "string" ||
    !/^[\w.-]{1,160}$/.test(release["buildId"]) ||
    typeof release["builtAt"] !== "string" ||
    Number.isNaN(Date.parse(release["builtAt"]))
  )
    throw new Error("Update information is unavailable.");
  return { version: release["version"], buildId: release["buildId"], builtAt: release["builtAt"] };
}

/** Query only this app's deployment; never an external update service. */
export async function fetchAppRelease(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<AppRelease> {
  const response = await fetcher(`/app-version.json?check=${Date.now()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
    throw new Error("Unable to check for updates. Please try again when connected.");
  return parseAppRelease(await response.json());
}

export function isNewAppBuild(currentBuildId: string, release: AppRelease): boolean {
  return release.buildId !== currentBuildId;
}

/** Keep the origin, page and hash; a fresh query avoids a cached HTML document. */
export function updateReloadUrl(currentHref: string, release: AppRelease): string {
  const url = new URL(currentHref);
  url.searchParams.set("vin_update", release.buildId);
  return url.href;
}
