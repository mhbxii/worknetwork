import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export type MetaOption = { id: number; name: string };

type MetaStore = {
  statusOptions: MetaOption[];
  categoryOptions: MetaOption[];
  DbSkills: MetaOption[];
  countryOptions: MetaOption[];
  loading: boolean;
  fetchMeta: () => Promise<void>;
};

export const useMetaStore = create<MetaStore>((set) => ({
  statusOptions: [],
  categoryOptions: [],
  DbSkills: [],
  countryOptions: [],
  loading: false,
  fetchMeta: async () => {
    set({ loading: true });
    const [{ data: statusData }, { data: categoryData }, { data: DbSkillsData }, { data: countryData } ] = await Promise.all([
      supabase.from("status").select("id, name"),
      supabase.from("job_categories").select("id, name"),
      supabase.from("skills").select("id, name").order("name"),
      supabase.from("country").select("id, code").order("code"),
    ]);

    set({
      statusOptions: statusData ?? [],
      categoryOptions: categoryData ?? [],
      DbSkills: DbSkillsData || [],
      countryOptions: (countryData ?? []).map((country) => ({
        id: country.id,
        name: country.code, // Using 'code' as the 'name' field
      })),
      loading: false,
    });
  },
}));