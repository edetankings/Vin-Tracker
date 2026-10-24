import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { NotebookPen, Plus, Search, Trash2, FileText, Pencil } from "lucide-react";
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
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDesktop } from "@/hooks/use-desktop";
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
  const desktop = useDesktop();
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
        (note) => note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q),
      )
    : notes;

  const openEditor = (note: Note | null) => {
    setReading(null);
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

  const editor = (
    <form
      className="note-editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What did you learn?"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-content">Your notes</Label>
        <Textarea
          id="note-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write it in your own words…"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={createNote.isPending || updateNote.isPending}>
          {createNote.isPending || updateNote.isPending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
  const reader = reading ? (
    <div>
      <p className="text-[11px] text-muted-foreground">
        {format(parseISO(reading.updated_at), "MMMM d, yyyy")}
      </p>
      <p className="my-6 whitespace-pre-wrap break-words text-sm leading-7">
        {reading.content || "No details written for this note yet."}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => {
            setPendingDelete(reading);
            setReading(null);
          }}
        >
          <Trash2 size={14} /> Delete
        </Button>
        <Button onClick={() => openEditor(reading)}>
          <Pencil size={14} /> Edit note
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <AppShell title="My Learning Notes" subtitle="Capture what you learn.">
      <div className="notes-layout">
        <div className="min-w-0">
          <div className="page-toolbar">
            <div className="search-field">
              <Search />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
              />
            </div>
            <Button onClick={() => openEditor(null)}>
              <Plus size={15} /> New note
            </Button>
          </div>
          <p className="mb-4 text-[11px] text-muted-foreground">
            {visible.length} {visible.length === 1 ? "note" : "notes"} in your learning journal
          </p>
          {visible.length === 0 ? (
            <EmptyState
              icon={<NotebookPen size={24} />}
              title={notes.length === 0 ? "Your learning starts here" : "No matching notes"}
              description={
                notes.length === 0
                  ? "Save a thought, a discovery, or something you want to remember."
                  : "Try a different search word."
              }
            />
          ) : (
            <div className="notes-grid">
              {visible.map((note) => (
                <article
                  key={note.id}
                  className={`note-card ${reading?.id === note.id || (open && editing?.id === note.id) ? "is-selected" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setReading(note);
                    }}
                    className="block w-full text-left"
                  >
                    <span className="note-icon">
                      <FileText size={17} />
                    </span>
                    <h2 className="break-words">{note.title}</h2>
                    <p className="mt-2 line-clamp-4 text-muted-foreground">
                      {note.content || "A fresh page for your ideas."}
                    </p>
                  </button>
                  <div className="note-footer">
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(note.updated_at), "MMM d, yyyy")}
                    </span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => setPendingDelete(note)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        {desktop ? (
          <aside className="note-editor-panel" aria-label="Note details">
            <h2>
              {open
                ? editing
                  ? "Edit note"
                  : "New note"
                : reading
                  ? reading.title
                  : "A space for your ideas"}
            </h2>
            {open ? (
              editor
            ) : reading ? (
              reader
            ) : (
              <div className="py-12 text-center">
                <NotebookPen className="mx-auto mb-4 text-primary" size={30} />
                <p className="text-xs leading-6 text-muted-foreground">
                  Open a note to keep learning,
                  <br />
                  or capture a new discovery.
                </p>
                <Button className="mt-6" onClick={() => openEditor(null)}>
                  <Plus size={14} /> Create a note
                </Button>
              </div>
            )}
          </aside>
        ) : null}
      </div>
      {!desktop ? (
        <>
          <Sheet open={!!reading} onOpenChange={(next) => !next && setReading(null)}>
            <SheetContent side="bottom" className="responsive-sheet">
              <SheetHeader className="mb-5">
                <SheetTitle>{reading?.title}</SheetTitle>
                <SheetDescription className="sr-only">
                  Read and manage this learning note.
                </SheetDescription>
              </SheetHeader>
              {reader}
            </SheetContent>
          </Sheet>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="bottom" className="responsive-sheet">
              <SheetHeader className="mb-5">
                <SheetTitle>{editing ? "Edit note" : "New note"}</SheetTitle>
                <SheetDescription className="sr-only">
                  Capture what you learned with a title and your notes.
                </SheetDescription>
              </SheetHeader>
              {editor}
            </SheetContent>
          </Sheet>
        </>
      ) : null}

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
