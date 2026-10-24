import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { googleAuthErrorMessage } from "@/lib/google-auth";

export function GoogleAuthButton({
  label = "Continue with Google",
  disabled = false,
}: {
  label?: string;
  disabled?: boolean;
}) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connect = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setError(googleAuthErrorMessage(error));
      setBusy(false);
    }
  };
  return (
    <div className="google-auth-control">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-3 rounded-lg bg-card text-foreground"
        disabled={busy || disabled}
        onClick={() => void connect()}
      >
        {busy ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.7c-.9.6-2 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H2.9v2.8A10 10 0 0 0 12 22Z"
            />
            <path fill="#FBBC05" d="M6.3 13.7a6 6 0 0 1 0-3.4V7.5H2.9a10 10 0 0 0 0 9l3.4-2.8Z" />
            <path
              fill="#EA4335"
              d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9.1 5.5l3.4 2.8C7.1 7.9 9.4 6.1 12 6.1Z"
            />
          </svg>
        )}
        {busy ? "Connecting to Google…" : label}
      </Button>
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
