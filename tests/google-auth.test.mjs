import assert from "node:assert/strict";
import test from "node:test";
import {
  startGoogleAuth,
  finishGoogleAuth,
  loadGoogleProfile,
  hasGoogleIdentity,
  googleAuthErrorMessage,
  GOOGLE_LINK_KEY,
} from "../src/lib/google-auth.ts";

const googleUser = {
  id: "existing-id",
  email: "user@example.com",
  identities: [{ provider: "google" }],
  app_metadata: { providers: ["google"] },
  user_metadata: { full_name: "Google Name" },
};
const guest = { ...googleUser, identities: [], app_metadata: {}, is_anonymous: true };
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function authFixture({ user = null, error = null } = {}) {
  const calls = [];
  const client = {
    auth: {
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      signInWithOAuth: async (options) => {
        calls.push({ kind: "login", options });
        return { data: { url: "https://example.supabase.co/auth/v1/authorize" }, error };
      },
      linkIdentity: async (options) => {
        calls.push({ kind: "link", options });
        return { data: { url: "https://accounts.google.com/authorize" }, error };
      },
      exchangeCodeForSession: async (code) => {
        calls.push({ kind: "exchange", code });
        return { data: { user: googleUser, session: { user: googleUser } }, error };
      },
    },
  };
  return { client, calls };
}

test("signed-out users start Google OAuth with a fixed same-origin PKCE callback", async () => {
  const { client, calls } = authFixture();
  const store = storage({ [GOOGLE_LINK_KEY]: "stale-user" });
  await startGoogleAuth(client, "https://vin.example", store);
  assert.equal(calls[0].kind, "login");
  assert.equal(calls[0].options.provider, "google");
  assert.equal(calls[0].options.options.redirectTo, "https://vin.example/auth/callback");
  assert.equal(calls[0].options.options.skipBrowserRedirect, true);
  assert.equal(store.getItem(GOOGLE_LINK_KEY), null);
});

test("existing anonymous users link Google, keeping their original user ID", async () => {
  const { client, calls } = authFixture({ user: guest });
  const store = storage();
  await startGoogleAuth(client, "http://localhost:8080", store);
  assert.equal(calls[0].kind, "link");
  assert.equal(store.getItem(GOOGLE_LINK_KEY), "existing-id");
  assert(!calls.some((call) => call.kind === "login"));
});

test("failed or conflicting identity links do not fall back to switching accounts", async () => {
  const error = { message: "Identity already linked" };
  const { client, calls } = authFixture({ user: guest, error });
  const store = storage();
  await assert.rejects(
    startGoogleAuth(client, "https://vin.example", store),
    (actual) => actual === error,
  );
  assert.equal(store.getItem(GOOGLE_LINK_KEY), null);
  assert.deepEqual(
    calls.map((call) => call.kind),
    ["link"],
  );
});

test("linking refuses unverifiable sessions and blocked recovery storage", async () => {
  const { client, calls } = authFixture({ user: guest });
  client.auth.getUser = async () => ({
    data: { user: null },
    error: { message: "Invalid session" },
  });
  await assert.rejects(startGoogleAuth(client, "https://vin.example", storage()));
  assert.deepEqual(calls, []);
  const valid = authFixture({ user: guest });
  const blocked = {
    ...storage(),
    setItem: () => {
      throw new Error("Storage disabled");
    },
  };
  await assert.rejects(startGoogleAuth(valid.client, "https://vin.example", blocked));
  assert.deepEqual(valid.calls, []);
});

test("successful callbacks verify the linked identity and return only to fixed app routes", async () => {
  const { client, calls } = authFixture();
  const store = storage({ [GOOGLE_LINK_KEY]: "existing-id" });
  assert.deepEqual(
    await finishGoogleAuth(
      client,
      "https://vin.example/auth/callback?code=one-use&next=https://evil.example",
      store,
    ),
    { returnTo: "/settings" },
  );
  assert.deepEqual(calls, [{ kind: "exchange", code: "one-use" }]);
  assert.equal(store.getItem(GOOGLE_LINK_KEY), null);
  assert.deepEqual(
    await finishGoogleAuth(client, "https://vin.example/auth/callback?code=other-code", store),
    { returnTo: "/" },
  );
});

test("cancelled, missing-code, failed and mismatched callbacks cannot report success", async () => {
  const { client, calls } = authFixture();
  await assert.rejects(
    finishGoogleAuth(client, "https://vin.example/auth/callback?error=access_denied", storage()),
    /access_denied/,
  );
  await assert.rejects(
    finishGoogleAuth(client, "https://vin.example/auth/callback", storage()),
    /No Google sign-in code/,
  );
  assert.deepEqual(calls, []);
  await assert.rejects(
    finishGoogleAuth(
      client,
      "https://vin.example/auth/callback?code=test",
      storage({ [GOOGLE_LINK_KEY]: "another-id" }),
    ),
    /original profile/,
  );
  const failed = authFixture({ error: new Error("PKCE verifier expired") });
  await assert.rejects(
    finishGoogleAuth(failed.client, "https://vin.example/auth/callback?code=expired", storage()),
    /expired/,
  );
});

function profileFixture(existing, { insertError = null } = {}) {
  const inserts = [];
  let reads = 0;
  const client = {
    from: (table) => {
      assert.equal(table, "profiles");
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data:
                reads++ && insertError?.code === "23505"
                  ? { name: "Concurrent custom name" }
                  : existing,
              error: null,
            }),
          }),
        }),
        insert: (profile) => {
          inserts.push(profile);
          return {
            select: () => ({
              single: async () => ({
                data: insertError ? null : { name: profile.name },
                error: insertError,
              }),
            }),
          };
        },
      };
    },
  };
  return { client, inserts };
}

test("existing Google profile names are kept without any writes", async () => {
  const { client, inserts } = profileFixture({ name: "My chosen name" });
  assert.deepEqual(await loadGoogleProfile(client, googleUser), {
    userId: "existing-id",
    name: "My chosen name",
  });
  assert.deepEqual(inserts, []);
});

test("new Google users get a profile on their own ID using the display name", async () => {
  const { client, inserts } = profileFixture(null);
  assert.deepEqual(await loadGoogleProfile(client, googleUser), {
    userId: "existing-id",
    name: "Google Name",
  });
  assert.deepEqual(inserts, [{ id: "existing-id", name: "Google Name" }]);
  const anon = profileFixture(null);
  assert.equal((await loadGoogleProfile(anon.client, guest)).name, null);
  assert.deepEqual(anon.inserts, []);
});

test("concurrent profile creation keeps the already-created profile", async () => {
  const { client } = profileFixture(null, { insertError: { code: "23505" } });
  assert.equal((await loadGoogleProfile(client, googleUser)).name, "Concurrent custom name");
});

test("provider, linking and conflict errors explain the next action", () => {
  assert(hasGoogleIdentity(googleUser));
  assert(!hasGoogleIdentity(guest));
  assert.match(
    googleAuthErrorMessage(new Error("Unsupported provider: provider is not enabled")),
    /not enabled/,
  );
  assert.match(
    googleAuthErrorMessage(new Error("Manual linking is disabled")),
    /manual identity linking/,
  );
  assert.match(
    googleAuthErrorMessage(new Error("Identity already linked")),
    /current tasks are unchanged/,
  );
});

test("callback forwards a supplied PKCE flow ID to the SDK", async () => {
  const { client } = authFixture();
  let received;
  client.auth.exchangeCodeForSession = async (code, options) => {
    received = { code, options };
    return { data: { user: googleUser, session: { user: googleUser } }, error: null };
  };
  await finishGoogleAuth(
    client,
    "https://vin.example/auth/callback?code=one-use&sb_flow_id=flow-123",
    storage(),
  );
  assert.deepEqual(received, { code: "one-use", options: { flowId: "flow-123" } });
});
