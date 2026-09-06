import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { NotebookPen, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useNoteMutations, useNotes, type Note } from "@/lib/notes";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Learning Notes — Vin Tracker" },
      { name: "description", content: "Capture what you learn in a simple personal journal." },
      { property: "og:title", content: "Learning Notes — Vin Tracker" },
      {
        property: "og:description",
        content: "Capture what you learn in a simple personal journal.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <NotesPage />
    </AppGate>
  ),
});

function NotesPage() {
  const { userId } = useAuth();
  const { data: notes = [] } = useNotes(userId);
  const { createNote, updateNote, deleteNote } = useNoteMutations(userId);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [reading, setReading] = useState<Note | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q),
      )
    : notes;

  const openEditor = (note: Note | null) => {
    setEditing(note);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setOpen(true);
  };

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Give your note a title");
      return;
    }
    const payload = { title: trimmed, content: content.trim() };
    try {
      if (editing) {
        await updateNote.mutateAsync({ id: editing.id, changes: payload });
        toast.success("Note updated");
      } else {
        await createNote.mutateAsync(payload);
        toast.success("Note saved");
      }
      setOpen(false);
    } catch {
      toast.error("Could not save your note");
    }
  };

  return (
    <AppShell title="My Learning Notes" subtitle="Capture what you learn.">
      <Button className="w-full rounded-2xl" size="lg" onClick={() => openEditor(null)}>
        <Plus className="h-4 w-4" /> New Note
      </Button>

      {notes.length > 0 ? (
        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes"
            className="rounded-2xl pl-9"
          />
        </div>
      ) : null}

      <div className="mt-4 space-y-2.5">
        {visible.length === 0 ? (
          <EmptyState
            icon={<NotebookPen className="h-6 w-6" />}
            title={notes.length === 0 ? "No notes yet" : "No matching notes"}
            description={
              notes.length === 0
                ? "Write down something you learned today."
                : "Try a different search word."
            }
          />
        ) : (
          visible.map((note) => (
            <article
              key={note.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-card"
            >
              <button
                type="button"
                onClick={() => openEditor(note)}
                className="block w-full text-left"
              >
                <h2 className="text-sm font-semibold">{note.title}</h2>
                {note.content ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content}</p>
                ) : null}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {format(parseISO(note.created_at), "MMMM d, yyyy")}
                  {note.updated_at !== note.created_at
                    ? ` · updated ${format(parseISO(note.updated_at), "MMM d")}`
                    : ""}
                </p>
              </button>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setPendingDelete(note)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle>{editing ? "Edit note" : "New note"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What did you learn?"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-content">What did you learn?</Label>
              <Textarea
                id="note-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write it in your own words..."
                className="min-h-44 rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-2xl" onClick={save}>
                Save Note
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteNote.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
