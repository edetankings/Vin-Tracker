import { createContext, useContext } from "react";
import type { AppRelease } from "@/lib/app-updates";

export type UpdateStatus = "idle" | "checking" | "current" | "available" | "error";
type UpdateContextValue = {
  latest: AppRelease | null;
  status: UpdateStatus;
  error: string | null;
  updating: boolean;
  dismissed: boolean;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};
export const UpdateContext = createContext<UpdateContextValue | null>(null);

export function useAppUpdates() {
  const context = useContext(UpdateContext);
  if (!context) throw new Error("useAppUpdates must be used inside AppUpdateProvider");
  return context;
}
