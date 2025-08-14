// src/services/geminiSummarizer.ts
import { supabase } from "@/lib/supabase";
import { OnboardingForm } from "@/types/entities";

export interface Project {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface Experience {
  company_id: number | null;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string;
}

interface SummarizedRawCV {
  job_title: string;
  projects: Project[];
  experiences: Experience[];
  skills: string[]; // names
}

// --- Step 1: Summarize ---
export async function summarizeCV(parsedText: string): Promise<SummarizedRawCV> {
  const prompt = `Extract as much structured information as possible from the following CV. 
Return **valid JSON only** with this structure:
{
  "job_title": string,
  "projects": [{ "name": string, "description": string(255 char max), "start_date": string|null, "end_date": string|null }],
  "skills": [ string ],
  "professional_experience": [{ "company_name": string, "job_title": string, "start_date": string|null, "end_date": string|null }]
}
CV Text:
${parsedText}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const data = await res.json();
  if (!res.ok || !data?.candidates?.length) {
    throw new Error(data?.error?.message || "Gemini request failed");
  }

  const rawText = data.candidates[0]?.content?.parts?.[0]?.text || "";
  const cleaned = rawText.replace(/```json/i, "").replace(/```/g, "").trim();

  let structured: any;
  try {
    structured = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON: " + rawText);
  }

  return {
    job_title: structured.job_title || structured.jobtitle || "",
    projects: (structured.projects || []).slice(0, 5),
    experiences: structured.professional_experience || structured.experiences || [],
    skills: structured.skills || structured.skillset || [],
  };
}

// --- Step 2: Map skill names to IDs ---
export async function summarizeCVToForm(
  parsedText: string,
  existingForm: OnboardingForm
): Promise<OnboardingForm> {
  const raw = await summarizeCV(parsedText);

  // Fetch skills from DB
  const { data: dbSkills } = await supabase
    .from("skills")
    .select("id,name")
    .in("name", raw.skills);

  const skillIds = (dbSkills || []).map((s) => s.id).slice(0, 15);

  return {
    ...existingForm,
    job_title: raw.job_title,
    projects: raw.projects,
    experiences: raw.experiences,
    skills: skillIds, // ✅ final numeric IDs
  };
}
