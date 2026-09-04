import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

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
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });
}

export function useNoteMutations(userId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notes", userId] });
  };

  const createNote = useMutation({
    mutationFn: async (input: NoteInput) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("notes").insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: NoteInput }) => {
      const { error } = await supabase.from("notes").update(changes).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createNote, updateNote, deleteNote };
}
