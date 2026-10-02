import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export function Onboarding() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setBusy(true);
    try {
      await register(name);
    } catch (error) {
      console.error("Profile setup failed", error);
      const detail = error instanceof Error ? error.message : "";
      toast.error("Could not set up your profile. Please try again.", {
        description: detail || undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6">
      <div className="mx-auto w-full max-w-sm">
        <img
          src="/images/vin-icon.png"
          alt="Vin Tracker logo"
          width={72}
          height={72}
          className="h-18 w-18 rounded-3xl"
        />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Vin Tracker</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track your tasks. Build consistency.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              What should we call you?
            </label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Kingsley"
              autoComplete="given-name"
              enterKeyHint="go"
              className="h-13 rounded-2xl text-base"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-13 w-full rounded-2xl text-base font-semibold"
          >
            Continue
          </Button>
        </form>
        <p className="mt-6 text-xs text-muted-foreground">
          No email, no password. Your tasks are stored securely and stay with you on this device.
        </p>
      </div>
    </div>
  );
}
