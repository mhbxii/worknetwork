import { supabase } from "../lib/supabase";
import { useAuth } from "../store/authStore";

export async function fetchUser() {
  const { session, setUser, setProfile } = useAuth.getState();
  if (!session?.user) return;

  // 1) fetch base user row
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_user_id", session.user.id)
    .single();

  if (userError || !userData) {
    setUser(null);
    setProfile(null);
    return;
  }

  setUser(userData);

  // 2) role-specific loading (explicit queries)
  try {
    // ---------- CANDIDATE ----------
    if (userData.role_id === 1) {
      const candidateQ = supabase
        .from("candidates")
        .select("job_title, job_category_id")
        .eq("user_id", userData.id)
        .single();

      const projectsQ = supabase
        .from("candidate_projects")
        .select("name, description, start_date, end_date")
        .eq("candidate_id", userData.id);

      const experiencesQ = supabase
        .from("candidate_experiences")
        .select("company_id, job_title, start_date, end_date, companies(name)")
        .eq("candidate_id", userData.id);

      const skillsQ = supabase
        .from("candidate_skills")
        .select("skill_id")
        .eq("candidate_id", userData.id);

      const [
        { data: candidateData, error: candidateError },
        { data: projectsData, error: projectsError },
        { data: experiencesData, error: experiencesError },
        { data: skillsData, error: skillsError },
      ] = await Promise.all([candidateQ, projectsQ, experiencesQ, skillsQ]);

      if (candidateError || !candidateData) {
        setProfile(null);
        return;
      }

      const projects = projectsError || !projectsData ? [] : projectsData;
      const experiencesRaw =
        experiencesError || !experiencesData ? [] : experiencesData;
      const experiences = experiencesRaw.map((e: any) => ({
        company_id: e.company_id,
        company_name: Array.isArray(e.companies) && e.companies.length > 0 ? e.companies[0].name : "",
        job_title: e.job_title,
        start_date: e.start_date,
        end_date: e.end_date,
      }));
      const skills =
        skillsError || !skillsData
          ? []
          : skillsData.map((s: any) => s.skill_id);

      setProfile({
        role: "candidate" as const,
        data: {
          job_title: candidateData.job_title ?? "",
          job_category_id: candidateData.job_category_id ?? null,
          projects,
          experiences,
          skills,
        },
      });

      return;
    }

    // ---------- RECRUITER ----------
    if (userData.role_id === 2) {
      const { data: hrData, error: hrError } = await supabase
        .from("hrs")
        .select("company_id, position_title, companies(name)")
        .eq("user_id", userData.id)
        .single();

      if (hrError || !hrData) {
        setProfile(null);
        return;
      }

      setProfile({
        role: "recruiter" as const,
        data: {
          company_id: hrData.company_id,
          company_name:
            Array.isArray(hrData.companies) && hrData.companies.length > 0
              ? hrData.companies[0].name
              : "",

          position_title: hrData.position_title ?? "",
        },
      });

      return;
    }

    // ---------- ADMIN ----------
    if (userData.role_id === 3) {
      setProfile({ role: "admin" as const, data: null });
      return;
    }

    // fallback
    setProfile(null);
  } catch (err) {
    // any unexpected error -> clear profile to keep state consistent
    console.error("Error fetching user profile:", err);
  }
}

// New: fetch supabase session & user from DB and update Zustand
export async function loadSessionAndUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const auth = useAuth.getState();

  if (session) {
    auth.setSession(session);
    await fetchUser();
  } else {
    auth.clearAuth();
  }
}
