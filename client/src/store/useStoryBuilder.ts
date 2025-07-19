// store/useStoryBuilder.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type Character = { id: string; avatar: string };

interface StoryBuilder {
  characters: Character[];
  moral: string;
  theme: string;
  rhyming: boolean;
  previews: string[];
  addCharacter: (c: Character) => void;
  removeCharacter: (id: string) => void;
  setMoral: (m: string) => void;
  setTheme: (t: string) => void;
  setRhyming: (r: boolean) => void;
  fetchPreview: () => Promise<void>;
  saveStory: () => Promise<void>;
}

export const useStoryBuilder = create<StoryBuilder>()(
  devtools((set, get) => ({
    characters: [],
    moral: "",
    theme: "none",
    rhyming: false,
    previews: [],

    addCharacter: (c) =>
      set((s) => ({
        characters:
          s.characters.length < 2 ? [...s.characters, c] : s.characters,
      })),
    removeCharacter: (id) =>
      set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),
    setMoral: (m) => set({ moral: m }),
    setTheme: (t) => set({ theme: t }),
    setRhyming: (r) => set({ rhyming: r }),

    fetchPreview: async () => {
      const { characters, moral, theme, rhyming } = get();
      const resp = await fetch("/api/story/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characters, moral, theme, rhyming }),
      });
      const imgs: string[] = await resp.json();
      set({ previews: imgs });
    },

    saveStory: async () => {
      const { characters, moral, theme, rhyming } = get();
      const resp = await fetch("/api/story/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characters, moral, theme, rhyming }),
      });
      // returns orderDraftId but we don't use it here
      await resp.json();
      // also trigger a fresh preview after save
      await get().fetchPreview();
    },
  })),
);
