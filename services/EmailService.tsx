// services/emailService.ts
import { Job, Proposal, User } from '@/types/entities';

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

// You'll need to verify this domain in Resend dashboard
const FROM_EMAIL = 'noreply@yourdomain.com'; // Replace with your verified domain

interface EmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

interface ProposalAcceptanceEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  recruiterEmail: string;
  jobId: number;
  proposalId: number;
}

interface ProposalRejectionEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  jobId: number;
  proposalId: number;
  feedback?: string;
}

class EmailService {
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<EmailResponse> {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
          text: text || this.stripHtml(html), // Fallback text version
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return {
        success: true,
        id: data.id,
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private generateAcceptanceEmailTemplate(data: ProposalAcceptanceEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposal Accepted</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .highlight { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations! Your Proposal was Accepted</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${data.candidateName}</strong>,</p>
              
              <p>Great news! <strong>${data.companyName}</strong> has accepted your proposal for the position:</p>
              
              <div class="card">
                <h3>${data.jobTitle}</h3>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Recruiter:</strong> ${data.recruiterName}</p>
              </div>

              <div class="highlight">
                <h4>Next Steps:</h4>
                <ul>
                  <li>The recruiter will contact you soon to schedule an interview</li>
                  <li>Please prepare your portfolio and references</li>
                  <li>Check your email regularly for interview details</li>
                </ul>
              </div>

              <p>If you have any questions, feel free to reach out to:</p>
              <p><strong>${data.recruiterName}</strong><br/>
              Email: <a href="mailto:${data.recruiterEmail}">${data.recruiterEmail}</a></p>

              <p>We're excited about this opportunity and look forward to the next steps!</p>

              <div class="footer">
                <p>This email was sent regarding your job application. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateRejectionEmailTemplate(data: ProposalRejectionEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366f1; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .feedback { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${data.candidateName}</strong>,</p>
              
              <p>Thank you for your interest in the position at <strong>${data.companyName}</strong>.</p>
              
              <div class="card">
                <h3>${data.jobTitle}</h3>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Recruiter:</strong> ${data.recruiterName}</p>
              </div>

              <p>After careful consideration, we have decided to move forward with other candidates for this particular role. This decision was not easy, as we received many qualified applications.</p>

              ${data.feedback ? `
                <div class="feedback">
                  <h4>Feedback:</h4>
                  <p>${data.feedback}</p>
                </div>
              ` : ''}

              <p>We encourage you to:</p>
              <ul>
                <li>Continue building your skills and experience</li>
                <li>Apply for other positions that match your profile</li>
                <li>Keep your profile updated for future opportunities</li>
              </ul>

              <p>We wish you the best of luck in your job search and hope you find the perfect opportunity soon!</p>

              <div class="footer">
                <p>This email was sent regarding your job application. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendProposalAcceptanceEmail(data: ProposalAcceptanceEmailData): Promise<EmailResponse> {
    const subject = `🎉 Your proposal for ${data.jobTitle} at ${data.companyName} has been accepted!`;
    const html = this.generateAcceptanceEmailTemplate(data);
    
    return this.sendEmail(data.candidateEmail, subject, html);
  }

  async sendProposalRejectionEmail(data: ProposalRejectionEmailData): Promise<EmailResponse> {
    const subject = `Application Update: ${data.jobTitle} at ${data.companyName}`;
    const html = this.generateRejectionEmailTemplate(data);
    
    return this.sendEmail(data.candidateEmail, subject, html);
  }

  // Helper method to extract email data from proposal and job
  createAcceptanceEmailData(
    proposal: Proposal, 
    job: Job, 
    recruiter: User,
    companyName: string
  ): ProposalAcceptanceEmailData {
    return {
      candidateName: proposal.user.name,
      candidateEmail: proposal.user.email,
      jobTitle: job.title,
      companyName,
      recruiterName: recruiter.name,
      recruiterEmail: recruiter.email,
      jobId: job.id,
      proposalId: proposal.id,
    };
  }

  createRejectionEmailData(
    proposal: Proposal, 
    job: Job, 
    recruiter: User,
    companyName: string,
    feedback?: string
  ): ProposalRejectionEmailData {
    return {
      candidateName: proposal.user.name,
      candidateEmail: proposal.user.email,
      jobTitle: job.title,
      companyName,
      recruiterName: recruiter.name,
      jobId: job.id,
      proposalId: proposal.id,
      feedback,
    };
  }
}

export const emailService = new EmailService();