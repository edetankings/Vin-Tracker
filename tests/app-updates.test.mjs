import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchAppRelease,
  isNewAppBuild,
  parseAppRelease,
  updateReloadUrl,
} from "../src/lib/app-updates.ts";

const release = {
  version: "1.1.1",
  buildId: "1.1.1-1792960000000",
  builtAt: "2026-10-25T20:00:00.000Z",
};

test("fresh update checks use the same origin, JSON and no HTTP cache", async () => {
  const controller = new AbortController();
  let request;
  const actual = await fetchAppRelease(async (url, init) => {
    request = { url, init };
    return Response.json(release);
  }, controller.signal);
  assert.deepEqual(actual, release);
  assert.match(request.url, /^\/app-version\.json\?check=\d+$/);
  assert.equal(request.init.cache, "no-store");
  assert.equal(request.init.credentials, "same-origin");
  assert.equal(request.init.signal, controller.signal);
});

test("a different build is an update even when the version stays the same", () => {
  assert.equal(isNewAppBuild(release.buildId, release), false);
  assert.equal(isNewAppBuild("1.1.1-older-build", release), true);
});

test("missing, malformed and HTML update responses cannot trigger a reload", async () => {
  for (const response of [
    new Response("Not found", { status: 404 }),
    new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } }),
    Response.json({ version: "1.1.1" }),
    Response.json({ ...release, buildId: "https://evil.example" }),
    Response.json({ ...release, builtAt: "not-a-date" }),
  ]) {
    await assert.rejects(fetchAppRelease(async () => response));
  }
  for (const invalid of [null, [], {}, { ...release, version: "invalid" }])
    assert.throws(() => parseAppRelease(invalid));
});

test("network and abort errors reach the caller without pretending an update succeeded", async () => {
  await assert.rejects(
    fetchAppRelease(async () => {
      throw new TypeError("Failed to fetch");
    }),
    /fetch/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchAppRelease(async (_, init) => {
      init.signal.throwIfAborted();
    }, controller.signal),
    { name: "AbortError" },
  );
});

test("updating keeps the current origin, page, existing search and hash", () => {
  const url = new URL(updateReloadUrl("https://vin.example/calendar?month=10#today", release));
  assert.equal(url.origin, "https://vin.example");
  assert.equal(url.pathname, "/calendar");
  assert.equal(url.searchParams.get("month"), "10");
  assert.equal(url.hash, "#today");
  assert.equal(url.searchParams.get("vin_update"), release.buildId);
});

test("repeated updates replace their cache-busting marker instead of accumulating parameters", () => {
  const url = new URL(updateReloadUrl("https://vin.example/tasks?vin_update=old", release));
  assert.deepEqual(url.searchParams.getAll("vin_update"), [release.buildId]);
});
