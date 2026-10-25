import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Download,
  Moon,
  Smartphone,
  Sun,
  SunMoon,
  UserRound,
  Palette,
  Database,
  Info,
  HardDrive,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  readLocalData,
  replaceLocalData,
  validateLocalData,
  storageErrorMessage,
  type LocalData,
} from "@/lib/local-store";
import { useAuth } from "@/lib/auth";
import { useInstallApp } from "@/lib/pwa";
import { requestNotificationPermission, setRemindersEnabled } from "@/lib/reminders";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useTaskMutations, useTasks, toDateKey } from "@/lib/tasks";

const APP_VERSION = "1.0.0";
const NOTIF_KEY = "vin-reminders-enabled";

function loadReminderPref() {
  try {
    return window.localStorage.getItem(NOTIF_KEY) === "1";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Vin Tracker" },
      { name: "description", content: "Update your name, switch themes and manage your data." },
      { property: "og:title", content: "Settings — Vin Tracker" },
      {
        property: "og:description",
        content: "Update your name, switch themes and manage your data.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <SettingsPage />
    </AppGate>
  ),
});

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SunMoon },
];

function SettingsPage() {
  const { userId, name, updateName, resetLocalData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: tasks = [] } = useTasks(userId);
  const { deleteAllTasks } = useTaskMutations(userId);
  const [draft, setDraft] = useState(name ?? "");
  const importInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<LocalData | null>(null);
  useEffect(() => {
    setDraft(name ?? "");
  }, [name]);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState(loadReminderPref);
  const { canInstall, installed, install } = useInstallApp();

  const toggleReminders = async () => {
    const next = !reminders;
    if (next) {
      const permission = await requestNotificationPermission();
      if (permission === "unsupported") {
        toast.error("This browser can't show reminders");
        return;
      }
      if (permission !== "granted") {
        toast.error("Allow notifications to get reminders");
        return;
      }
    }
    setReminders(next);
    setRemindersEnabled(next);
    toast.success(next ? "Reminders turned on" : "Reminders turned off");
  };

  const installApp = async () => {
    const result = await install();
    if (result === "unavailable") {
      toast("Open the browser menu and choose \u201cAdd to Home screen\u201d");
    }
  };

  const exportData = () => {
    const payload = {
      app: "Vin Tracker",
      version: APP_VERSION,
      exported_at: new Date().toISOString(),
      ...readLocalData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vin-tracker-export-${toDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data has been exported");
  };

  const saveName = async () => {
    if (!draft.trim()) {
      toast.error("Your name can't be empty");
      return;
    }
    setSaving(true);
    try {
      await updateName(draft);
      toast.success("Name updated");
    } catch (error) {
      toast.error(storageErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="A workspace that feels like you.">
      <div className="settings-layout">
        <nav className="settings-navigation" aria-label="Settings sections">
          <a href="#profile">
            <UserRound size={16} /> Profile
          </a>
          <a href="#appearance">
            <Palette size={16} /> Appearance
          </a>
          <a href="#notifications">
            <Bell size={16} /> Notifications
          </a>
          <a href="#app">
            <Smartphone size={16} /> App
          </a>
          <a href="#data">
            <Database size={16} /> Your data
          </a>
          <a href="#about">
            <Info size={16} /> About
          </a>
        </nav>
        <div className="settings-content">
          <section
            id="profile"
            className="rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <div className="profile-summary">
              <span className="profile-avatar">{name?.slice(0, 1).toUpperCase()}</span>
              <div>
                <p className="text-sm font-bold">{name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Local profile</p>
              </div>
            </div>
            <Label htmlFor="name" className="text-sm font-semibold">
              Your name
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="name"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="rounded-2xl"
              />
              <Button onClick={saveName} disabled={saving || draft.trim() === (name ?? "")}>
                Save
              </Button>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-secondary p-4">
              <HardDrive size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold">Saved in this browser</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  Your profile, tasks and notes stay on this device. Export a backup before clearing
                  browser data or switching browsers.
                </p>
              </div>
            </div>
          </section>

          <section
            id="appearance"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-semibold">Appearance</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-medium transition-colors",
                    theme === value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section
            id="notifications"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              role="switch"
              aria-checked={reminders}
              aria-label="Task reminders"
              onClick={() => void toggleReminders()}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-border px-3.5 py-3 text-left transition-colors hover:bg-secondary/60"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {reminders ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">Task reminders</span>
                  <span className="block text-xs text-muted-foreground">
                    Remind me about today's tasks
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  reminders ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all",
                    reminders ? "left-[22px]" : "left-0.5",
                  )}
                />
              </span>
            </button>
          </section>

          <section
            id="app"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-semibold">App</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {installed ? "Vin Tracker is installed" : "Install Vin Tracker"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {installed
                    ? "You're using the installed app."
                    : "Add it to your home screen and open it like a normal app."}
                </p>
              </div>
            </div>
            {!installed ? (
              <Button className="mt-3 w-full rounded-2xl" onClick={() => void installApp()}>
                {canInstall ? "Install app" : "How to install"}
              </Button>
            ) : null}
          </section>

          <section
            id="data"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-semibold">Your data</p>
            <p className="mt-1 text-xs text-muted-foreground">{tasks.length} tasks saved</p>
            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" /> Export my data
              </Button>
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Import a Vin Tracker backup"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void file
                    .text()
                    .then((text) => setPendingImport(validateLocalData(JSON.parse(text))))
                    .catch((error) => toast.error(storageErrorMessage(error)));
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => importInput.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Restore backup
              </Button>
              <AlertDialog
                open={!!pendingImport}
                onOpenChange={(next) => {
                  if (!next) setPendingImport(null);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This replaces the profile and all tasks, notes and categories saved in this
                      browser with the backup. Export your current data first if you want to keep
                      it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        try {
                          replaceLocalData(pendingImport);
                          toast.success("Backup restored");
                          setPendingImport(null);
                        } catch (error) {
                          toast.error(storageErrorMessage(error));
                        }
                      }}
                    >
                      Restore backup
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Delete all tasks
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all tasks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes every task and its history. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteAllTasks.mutate(undefined, {
                          onSuccess: () => toast.success("All tasks deleted"),
                          onError: () => toast.error("Couldn't delete your tasks"),
                        });
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-destructive">
                    Delete all local data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all local data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes your profile, tasks, notes and custom categories from this
                      browser. Export a backup first if you want to keep them. This cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void resetLocalData().catch((error) =>
                          toast.error(storageErrorMessage(error)),
                        );
                      }}
                    >
                      Delete local data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          <section
            id="about"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-semibold">About</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vin Tracker</span>
              <span className="font-medium">Version {APP_VERSION}</span>
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Vin Tracker — Track your tasks. Build consistency.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
