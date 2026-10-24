import assert from "node:assert/strict";
import test from "node:test";
import { reportRuntimeError } from "../src/lib/runtime-error-reporting.ts";

test("route diagnostics work without browser globals during SSR", () => {
  assert.doesNotThrow(() => reportRuntimeError(new Error("SSR failure")));
});

test("caught browser errors retain the message, stack, route and boundary context", () => {
  const originalError = console.error;
  const calls = [];
  globalThis.window = { location: { pathname: "/tasks" } };
  console.error = (...args) => calls.push(args);
  try {
    const error = new Error("Task failed");
    reportRuntimeError(error, { boundary: "root" });
    assert.deepEqual(calls[0], [
      "[Vin Tracker]",
      "Task failed",
      {
        route: "/tasks",
        boundary: "root",
        stack: error.stack,
      },
    ]);
    reportRuntimeError(new Response(null, { status: 503 }));
    assert.equal(calls[1][1], "Response 503");
    reportRuntimeError("unexpected value");
    assert.equal(calls[2][1], "unexpected value");
  } finally {
    console.error = originalError;
    delete globalThis.window;
  }
});
