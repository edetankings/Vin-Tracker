import { APP_ICON } from "@/lib/app-meta";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storageErrorMessage } from "@/lib/local-store";
import { useAuth } from "@/lib/auth";

export function Onboarding() {
  const { register } = useAuth();
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setErrorMessage(null);
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setBusy(true);
    try {
      await register(name);
    } catch (error) {
      console.error("Profile setup failed", error);
      const detail = storageErrorMessage(error);
      setErrorMessage(detail);
      toast.error("Could not set up your profile", { description: detail });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-layout">
        <div>
          <div className="welcome-brand">
            <img src={APP_ICON} alt="Vin Tracker logo" width={94} height={94} />
            <h1>Vin Tracker</h1>
            <p>Track your tasks. Build consistency.</p>
          </div>
          <p className="welcome-promise">
            Make room for what matters.
            <br />
            One task. One day. A little better.
          </p>
        </div>
        <div>
          {started ? (
            <div className="welcome-form">
              <h2>Welcome to Vin Tracker</h2>
              <p>
                Plan your tasks, stay consistent, track your progress, and write down what you
                learn.
              </p>
              <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold">
                    Your name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="What should we call you?"
                    autoComplete="given-name"
                    enterKeyHint="go"
                    autoFocus
                    maxLength={80}
                    disabled={busy}
                    aria-invalid={!!errorMessage}
                    aria-describedby={errorMessage ? "profile-error" : undefined}
                  />
                </div>
                {errorMessage ? (
                  <p
                    id="profile-error"
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
                  >
                    {errorMessage}
                  </p>
                ) : null}
                <Button type="submit" disabled={busy} className="w-full font-semibold">
                  {busy ? "Setting up your space…" : "Continue"}
                </Button>
              </form>
              <p className="welcome-footnote">Let's make today count.</p>
            </div>
          ) : (
            <div className="welcome-form">
              <h2>Your day, a little clearer.</h2>
              <p>
                A simple place to plan your tasks, capture your learning, and see how far you've
                come.
              </p>
              <Button onClick={() => setStarted(true)} className="welcome-start">
                Get started <span aria-hidden="true">→</span>
              </Button>
              <p className="welcome-footnote">A simple way to stay on track.</p>
            </div>
          )}
          <p className="welcome-footnote">
            No account needed. Your tasks and notes are saved in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
