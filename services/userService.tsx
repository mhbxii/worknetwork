
import { MetaOption, User, UserProfile } from "@/types/entities";
import { supabase } from "../lib/supabase";
import { useAuth } from "../store/authStore";

// Cache to prevent unnecessary profile fetches
let profileCache: { [userId: string]: { profile: UserProfile, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchUser() {
  const { session, setUser, setProfile } = useAuth.getState();
  
  if (!session?.user) {
    console.log("fetchUser: No session, clearing user state");
    setUser(null);
    setProfile(null);
    return;
  }

  try {
    // 1) Fetch base user row
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        supabase_user_id,
        name,
        email,
        profile_pic_url,
        role:role_id(id, name),
        country:country_id(id, name),
        created_at,
        updated_at
      `)
      .eq("supabase_user_id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      console.error("fetchUser: Failed to fetch user data", error);
      setUser(null);
      setProfile(null);
      return;
    }

    const userData: User = {
      ...data,
      role: Array.isArray(data.role) ? data.role[0] ?? null : data.role ?? null,
      country: Array.isArray(data.country) ? data.country[0] ?? null : data.country ?? null,
    };

    console.log("fetchUser: Fetched user", userData.name);
    setUser(userData);

    // Check cache first
    const cacheKey = `${userData.id}_${userData.role?.name}`;
    const cachedData = profileCache[cacheKey];
    const now = Date.now();

    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log("fetchUser: Using cached profile");
      setProfile(cachedData.profile);
      return;
    }

    // 2) Fetch role-specific profile
    const profile = await fetchUserProfile(userData);
    
    if (profile) {
      // Cache the profile
      profileCache[cacheKey] = {
        profile,
        timestamp: now
      };
      
      // Clean old cache entries
      Object.keys(profileCache).forEach(key => {
        if (key !== cacheKey && (now - profileCache[key].timestamp) > CACHE_DURATION) {
          delete profileCache[key];
        }
      });
    }
    
    setProfile(profile);

  } catch (err) {
    console.error("fetchUser: Unexpected error", err);
    setProfile(null);
  }
}

async function fetchUserProfile(userData: User): Promise<UserProfile | null> {
  try {
    // ---------- CANDIDATE ----------
    if (userData.role?.name === "candidate") {
      return await fetchCandidateProfile(userData.id);
    }

    // ---------- RECRUITER ----------
    if (userData.role?.name === "recruiter") {
      return await fetchRecruiterProfile(userData.id);
    }

    // ---------- ADMIN ----------
    if (userData.role?.name === "admin") {
      return null;
    }

    return null;
  } catch (err) {
    console.error("fetchUserProfile: Error fetching profile", err);
    return null;
  }
}

async function fetchCandidateProfile(userId: number): Promise<UserProfile | null> {
  const candidateQ = supabase
    .from("candidates")
    .select("job_title, job_category_id, nb_proposals")
    .eq("user_id", userId)
    .single();

  const projectsQ = supabase
    .from("candidate_projects")
    .select("name, description, start_date, end_date")
    .eq("candidate_id", userId);

  const experiencesQ = supabase
    .from("candidate_experiences")
    .select("companies:company_id(id, name), job_title, start_date, end_date")
    .eq("candidate_id", userId);

  const skillsQ = supabase
    .from("candidate_skills")
    .select("skills:skill_id(id, name)")
    .eq("candidate_id", userId);

  const [
    { data: candidateData, error: candidateError },
    { data: projectsData, error: projectsError },
    { data: experiencesData, error: experiencesError },
    { data: skillsData, error: skillsError },
  ] = await Promise.all([candidateQ, projectsQ, experiencesQ, skillsQ]);

  if (candidateError || !candidateData) {
    return null;
  }

  // Fetch job category if exists
  let jobCategory: MetaOption | null = null;
  if (candidateData.job_category_id) {
    const { data: jobCategoryData } = await supabase
      .from("job_categories")
      .select("id, name")
      .eq("id", candidateData.job_category_id)
      .single();
    jobCategory = jobCategoryData || null;
  }

  // Process the data
  const projects = projectsData || [];
  const experiencesRaw = experiencesData || [];
  const skillsRaw = skillsData || [];

  const experiences = experiencesRaw.map((e: any) => ({
    company: e.companies ? { id: e.companies.id, name: e.companies.name } : null,
    job_title: e.job_title,
    start_date: e.start_date,
    end_date: e.end_date,
  }));

  const skills = skillsRaw
    .filter((s: any) => s.skills)
    .map((s: any) => ({ id: s.skills.id, name: s.skills.name }));

  return {
    job_title: candidateData.job_title ?? "",
    job_category: jobCategory,
    nb_proposals: candidateData.nb_proposals ?? null,
    projects,
    experiences,
    skills: skills.length > 0 ? skills : null,
  };
}

async function fetchRecruiterProfile(userId: number): Promise<UserProfile | null> {
  const { data: hrData, error: hrError } = await supabase
    .from("hrs")
    .select("company:companies(id, name), position_title")
    .eq("user_id", userId)
    .single();

  if (hrError || !hrData) {
    return null;
  }

  return {
    company: hrData.company as unknown as MetaOption,
    position_title: hrData.position_title ?? "",
  };
}

// // New: fetch supabase session & user from DB and update Zustand
// export async function loadSessionAndUser() {
//   console.log("loadSessionAndUser: Starting session load");
  
//   const { data: { session } } = await supabase.auth.getSession();
//   const auth = useAuth.getState();

//   if (session) {
//     console.log("loadSessionAndUser: Session found, fetching user");
//     auth.setSession(session);
//     await fetchUser();
//   } else {
//     console.log("loadSessionAndUser: No session, signing out");
//     auth.signOut();
//   }
// }