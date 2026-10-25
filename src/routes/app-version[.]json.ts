import { createFileRoute } from "@tanstack/react-router";
import { APP_VERSION, APP_BUILD_ID, APP_BUILT_AT } from "@/lib/app-meta";

export const Route = createFileRoute("/app-version.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          { version: APP_VERSION, buildId: APP_BUILD_ID, builtAt: APP_BUILT_AT },
          {
            headers: {
              "Cache-Control": "no-store, max-age=0",
              Pragma: "no-cache",
              "X-Content-Type-Options": "nosniff",
            },
          },
        ),
    },
  },
});
