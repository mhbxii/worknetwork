import { supabase } from "@/lib/supabase";
import { MetaOption } from "@/types/entities";
import { create } from "zustand";

type MetaStore = {
  statusOptions: MetaOption[];
  categoryOptions: MetaOption[];
  DbSkills: MetaOption[];
  countryOptions: MetaOption[];
  countryLookup: Record<number, string>; // new, id -> full country name
  loading: boolean;
  fetchMeta: () => Promise<void>;
};

export const useMetaStore = create<MetaStore>((set) => ({
  statusOptions: [],
  categoryOptions: [],
  DbSkills: [],
  countryOptions: [],
  countryLookup: {},
  loading: false,
  fetchMeta: async () => {
    set({ loading: true });
    const [{ data: statusData }, { data: categoryData }, { data: DbSkillsData }, { data: countryData } ] = await Promise.all([
      supabase.from("status").select("id, name"),
      supabase.from("job_categories").select("id, name"),
      supabase.from("skills").select("id, name").order("name"),
      supabase.from("country").select("id, name, code").order("code"),
    ]);

    set({
      statusOptions: statusData ?? [],
      categoryOptions: categoryData ?? [],
      DbSkills: DbSkillsData || [],
      countryOptions: (countryData ?? []).map((country) => ({
        id: country.id,
        name: country.code, // Using 'code' as the 'name' field
      })),
      countryLookup: Object.fromEntries((countryData ?? []).map(c => [c.id, (c.name ?? "").trim()])),
      loading: false,
    });
  },
}));