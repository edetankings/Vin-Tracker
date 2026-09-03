import { Plus } from "lucide-react";

export function AddTaskFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add task"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] right-1/2 z-50 flex h-14 w-14 translate-x-[calc(50%-0.5rem)] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 sm:right-6 sm:translate-x-0"
    >
      <Plus className="h-6 w-6" strokeWidth={2.6} />
    </button>
  );
}
