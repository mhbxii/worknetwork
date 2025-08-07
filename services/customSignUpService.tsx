import { supabase } from "@/lib/supabase";
import { OnboardingForm } from "@/types/userDetailsForm";
import "react-native-url-polyfill/auto";

export async function signUpCandidate(form: OnboardingForm) {
  const {
    email,
    password,
    name,
    country_id,
    job_title,
    experiences,
    projects,
    skills,
    job_category_id,
  } = form;

  // 0️⃣ Validate required fields
  if (!email || !password || !name || !country_id || !job_category_id) {
    throw new Error("Missing required fields");
  }

  // 1️⃣ Create Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError || !authData.user) {
    throw new Error(authError?.message || "Failed to create auth user");
  }
  const authUser = authData.user;

  // 2️⃣ Insert into users
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      supabase_user_id: authUser.id,
      name,
      email,
      role_id: 1, // Candidate
      country_id,
    })
    .select()
    .single();
  if (userError) throw new Error(userError.message);

  // 3️⃣ Insert into candidates
  const { data: candidateData, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      user_id: userData.id,
      job_title: job_title || null,
      job_category_id,
    })
    .select()
    .single();
  if (candidateError) throw new Error(candidateError.message);

  const candidate_id = candidateData.user_id;

  // 4️⃣ Insert skills
  if (skills?.length) {
    const skillRows = skills.map((skill_id) => ({ candidate_id, skill_id }));
    const { error: skillError } = await supabase
      .from("candidate_skills")
      .insert(skillRows);
    if (skillError) throw new Error(skillError.message);
  }

  // 5️⃣ Insert projects
  if (projects?.length) {
    const projectRows = projects.map((p) => ({
      candidate_id,
      name: p.name,
      description: p.description || null,
      start_date: p.start_date || null,
      end_date: p.end_date || null,
    }));
    const { error: projectError } = await supabase
      .from("candidate_projects")
      .insert(projectRows);
    if (projectError) throw new Error(projectError.message);
  }

  // 6️⃣ Insert experiences
  if (experiences?.length) {
    const expRows = experiences.map((e) => ({
      candidate_id,
      company_id: e.company_id,
      job_title: e.job_title,
      start_date: e.start_date || null,
      end_date: e.end_date || null,
    }));
    const { error: expError } = await supabase
      .from("candidate_experiences")
      .insert(expRows);
    if (expError) throw new Error(expError.message);
  }

  return { user: authUser, profile: userData, candidate: candidateData };
}

export async function signUpRecruiter(form: any) {
  const {
    email,
    password,
    name,
    country_id,
    company_id,
    company_name,
    position_title,
  } = form;

  // 0️⃣ Validate input
  if (
    !email ||
    !password ||
    !name ||
    !country_id ||
    (!company_id && !company_name)
  ) {
    throw new Error("Missing required fields");
  }

  // 1️⃣ Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError || !authData.user) {
    throw new Error(authError?.message || "Failed to create auth user");
  }
  const authUser = authData.user;

  // 2️⃣ Insert into users
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      supabase_user_id: authUser.id,
      name,
      email,
      role_id: 2, // Recruiter
      country_id,
    })
    .select()
    .single();
  if (userError) throw new Error(userError.message);

  // 3️⃣ Determine company_id
  let finalCompanyId = company_id;
  if (!company_id && company_name) {
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: company_name,
      })
      .select()
      .single();
    if (companyError) throw new Error(companyError.message);
    finalCompanyId = companyData.id;
  }

  // 4️⃣ Insert into hrs (not recruiters)
  const { data: hrData, error: hrError } = await supabase
    .from("hrs")
    .insert({
      user_id: userData.id,
      company_id: finalCompanyId,
      position_title: position_title || null,
    })
    .select()
    .single();
  if (hrError) throw new Error(hrError.message);

  return { user: authUser, profile: userData, recruiter: hrData };
}
