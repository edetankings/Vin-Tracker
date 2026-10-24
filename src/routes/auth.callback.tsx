import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { finishGoogleAuth, googleAuthErrorMessage } from "@/lib/google-auth";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing in — Vin Tracker" }, { name: "referrer", content: "no-referrer" }],
  }),
  component: GoogleCallback,
});

// An OAuth code is single-use. Reuse its promise across effect remounts.
let pending: { href: string; result: ReturnType<typeof finishGoogleAuth> } | undefined;

function GoogleCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const href = window.location.href;
    if (!pending || pending.href !== href)
      pending = { href, result: finishGoogleAuth(supabase, href, window.sessionStorage) };
    void pending.result
      .then(({ returnTo }) => {
        if (active) void navigate({ to: returnTo, replace: true });
      })
      .catch((error) => {
        if (active) {
          setError(googleAuthErrorMessage(error));
          window.history.replaceState(window.history.state, "", "/auth/callback");
        }
      });
    return () => {
      active = false;
    };
  }, [navigate]);
  return (
    <div className="welcome-screen">
      <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <img
          src="/images/vin-icon.png"
          width={56}
          height={56}
          alt=""
          className="mx-auto mb-6 rounded-xl"
        />
        <h1 className="text-xl font-bold">
          {error ? "Google sign-in needs another try" : "Finishing your sign-in"}
        </h1>
        {error ? (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-destructive">
              {error}
            </p>
            <Link
              to="/"
              replace
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Return to Vin Tracker
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle
              className="mx-auto mt-6 animate-spin text-primary"
              aria-label="Signing in"
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Connecting your account to your saved workspace.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
