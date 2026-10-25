import { Download, LoaderCircle, X } from "lucide-react";
import { useAppUpdates } from "@/lib/app-update-state";
import { APP_VERSION } from "@/lib/app-meta";
import { Button } from "@/components/ui/button";

export function AppUpdateNotice() {
  const { latest, dismissed, updating, error, applyUpdate, dismissUpdate } = useAppUpdates();
  if (!latest || dismissed) return null;
  return (
    <aside className="app-update-notice" aria-label="App update available">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-primary">
          <Download size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1" role="status" aria-live="polite">
          <p className="text-sm font-bold">
            Update available{latest.version !== APP_VERSION ? ` · ${latest.version}` : ""}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Finish any unsaved edits, then reload. Your saved tasks and notes stay on this device.
          </p>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          onClick={dismissUpdate}
          disabled={updating}
          aria-label="Remind me later"
        >
          <X size={16} />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4 h-11 w-full" onClick={() => void applyUpdate()} disabled={updating}>
        {updating ? <LoaderCircle className="animate-spin" /> : <Download />}
        {updating ? "Updating…" : "Update now"}
      </Button>
    </aside>
  );
}
