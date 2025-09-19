import { supabase } from "@/lib/supabase";
import { MetaOption } from "@/types/entities";

export interface AddJobData {
  title: string;
  description: string;
  category: MetaOption;
  skills: MetaOption[];
  companyId: number;
}

export interface AddJobResponse {
  success: boolean;
  error?: string;
}

export const addJob = async (jobData: AddJobData): Promise<AddJobResponse> => {
  try {
    // Insert job
    const { data: jobResult, error: jobError } = await supabase
      .from("jobs")
      .insert({
        company_id: jobData.companyId,
        title: jobData.title,
        description: jobData.description,
        job_category_id: jobData.category.id,
        status_id: 1, // Default "open" status
      })
      .select("id")
      .single();

    if (jobError) {
      console.error("Job insertion error:", jobError);
      return { success: false, error: jobError.message };
    }

    // Insert job skills if any selected
    if (jobData.skills.length > 0) {
      const skillInserts = jobData.skills.map((skill) => ({
        job_id: jobResult.id,
        skill_id: skill.id,
      }));

      const { error: skillsError } = await supabase
        .from("job_skills")
        .insert(skillInserts);

      if (skillsError) {
        console.error("Skills insertion error:", skillsError);
        // Job was created but skills failed - still return success
        // Could optionally delete the job here if skills are critical
        return { success: false, error: "Job created but skills failed to save" };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error adding job:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};