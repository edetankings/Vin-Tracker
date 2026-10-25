import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  readLocalData,
  createLocalNote,
  updateLocalNote,
  deleteLocalNote,
  storageErrorMessage,
} from "./local-store";
import { toast } from "sonner";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type NoteInput = {
  title: string;
  content: string;
};

export function useNotes(userId: string | null) {
  return useQuery({
    queryKey: ["notes", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Note[]> =>
      readLocalData()
        .notes.filter((note) => note.user_id === userId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  });
}
export function useNoteMutations(userId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notes", userId] });
  };
  const createNote = useMutation({
    mutationFn: async (input: NoteInput) => createLocalNote(userId, input),
    onSuccess: invalidate,
  });
  const updateNote = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: NoteInput }) =>
      updateLocalNote(userId, id, changes),
    onSuccess: invalidate,
  });
  const deleteNote = useMutation({
    mutationFn: async (id: string) => deleteLocalNote(userId, id),
    onSuccess: invalidate,
    onError: (error) => toast.error(storageErrorMessage(error)),
  });
  return { createNote, updateNote, deleteNote };
}
