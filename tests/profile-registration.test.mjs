import assert from "node:assert/strict";
import test from "node:test";
import { registerProfile, profileErrorMessage } from "../src/lib/profile-registration.ts";

function fixture({
  existing = false,
  saveError = null,
  authError = null,
  userError = null,
  sessionError = null,
  savedName = "Kingsley",
} = {}) {
  const calls = [];
  const user = { id: "existing-user" };
  let session = existing ? { user } : null;
  let failure = saveError;
  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: sessionError }),
      getUser: async () => {
        calls.push("verify-user");
        return { data: { user }, error: userError };
      },
      signInAnonymously: async () => {
        calls.push("signup");
        session = { user };
        return { data: { user, session }, error: authError };
      },
      signOut: async () => {
        throw new Error("Must not discard the user's session");
      },
    },
    from: (table) => {
      assert.equal(table, "profiles");
      return {
        upsert: (profile, options) => {
          calls.push({ profile, options });
          return {
            select: (columns) => {
              assert.equal(columns, "name");
              return {
                single: async () => ({
                  data: failure ? null : { name: savedName },
                  error: failure,
                }),
              };
            },
          };
        },
      };
    },
  };
  return {
    client,
    calls,
    retry: () => {
      failure = null;
    },
  };
}

test("name-only signup saves a trimmed name and verifies the saved profile", async () => {
  const { client, calls } = fixture();
  assert.deepEqual(await registerProfile(client, " Kingsley "), {
    userId: "existing-user",
    name: "Kingsley",
  });
  assert.equal(calls[0], "signup");
  assert.deepEqual(calls[1], {
    profile: { id: "existing-user", name: "Kingsley" },
    options: { onConflict: "id" },
  });
});

test("retry after a profile write failure reuses the session instead of creating another account", async () => {
  const error = { message: "Permission denied", code: "42501" };
  const { client, calls, retry } = fixture({ saveError: error });
  await assert.rejects(registerProfile(client, "Kingsley"), (actual) => actual === error);
  retry();
  await registerProfile(client, "Kingsley");
  assert.equal(calls.filter((call) => call === "signup").length, 1);
  assert(calls.includes("verify-user"));
});

test("existing users keep their identity", async () => {
  const { client, calls } = fixture({ existing: true });
  await registerProfile(client, "Kingsley");
  assert.equal(calls[0], "verify-user");
  assert(!calls.includes("signup"));
});

test("verification or session errors do not silently replace an account", async () => {
  for (const option of ["sessionError", "userError"]) {
    const error = { message: "Network unavailable" };
    const { client, calls } = fixture({ existing: true, [option]: error });
    await assert.rejects(registerProfile(client, "Kingsley"), (actual) => actual === error);
    assert(!calls.includes("signup"));
    assert(!calls.some((call) => typeof call === "object"));
  }
});

test("signup errors are returned before any profile write", async () => {
  const error = { message: "Anonymous sign-ins are disabled" };
  const { client, calls } = fixture({ authError: error });
  await assert.rejects(registerProfile(client, "Kingsley"), (actual) => actual === error);
  assert.deepEqual(calls, ["signup"]);
});

test("blank names and missing saved profiles cannot report success", async () => {
  const { client, calls } = fixture();
  await assert.rejects(registerProfile(client, "   "), /enter your name/);
  assert.deepEqual(calls, []);
  const missing = fixture({ savedName: null });
  await assert.rejects(registerProfile(missing.client, "Kingsley"), /not returned after saving/);
});

test("plain backend errors and connection failures show useful messages", () => {
  assert.equal(
    profileErrorMessage({ message: "Profile table is unavailable" }),
    "Profile table is unavailable",
  );
  assert.match(
    profileErrorMessage({ message: "Anonymous sign-ins are disabled" }),
    /Enable it in Supabase/,
  );
  assert.match(profileErrorMessage(new TypeError("Failed to fetch")), /Check your connection/);
  assert.match(profileErrorMessage(null), /try again/);
});
