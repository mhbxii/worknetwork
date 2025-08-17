import { CandidateProfile, Job } from "@/types/entities";

export function createMatchingPrompt(candidateProfile: CandidateProfile, job: Job): string {
  // Format candidate skills
  const candidateSkills = candidateProfile.skills?.map(s => s.name).join(', ') || 'None listed';
  
  // Format candidate experiences
  const candidateExperiences = candidateProfile.experiences?.map(exp => 
    `${exp.job_title} at ${exp.company?.name} (${exp.start_date || 'N/A'} - ${exp.end_date || 'Present'})`
  ).join('\n') || 'No experience listed';
  
  // Format candidate projects
  const candidateProjects = candidateProfile.projects?.map(proj => 
    `${proj.name}: ${proj.description} (${proj.start_date || 'N/A'} - ${proj.end_date || 'Present'})`
  ).join('\n') || 'No projects listed';
  
  // Format job required skills
  const jobSkills = job.skills?.map(s => s.name).join(', ') || 'None specified';

  return `Analyze the compatibility between this candidate and job posting. Return ONLY a numeric score from 0-10 (can include decimals like 8.5).

**JOB POSTING:**
- Title: ${job.title}
- Company: ${job.company.name}
- Category: ${job.category.name}
- Required Skills: ${jobSkills}
- Description: ${job.description || 'No description provided'}

**CANDIDATE PROFILE:**
- Current Job Title: ${candidateProfile.job_title || 'Not specified'}
- Skills: ${candidateSkills}

Professional Experience:
${candidateExperiences}

Projects:
${candidateProjects}

**SCORING CRITERIA:**
- Skills overlap (40%): How many required skills does the candidate have?
- Experience relevance (30%): How relevant is their work history to this role?
- Job title alignment (20%): Does their background match the seniority/type of role?
- Project relevance (10%): Do their projects demonstrate applicable experience?

Return ONLY the numeric score (e.g., "7.2" or "9.0"). No explanation needed.`;
}