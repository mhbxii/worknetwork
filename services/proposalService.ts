// services/proposalService.ts
import { supabase } from '@/lib/supabase';
import { Job, Proposal, User } from '@/types/entities';
import { emailService } from './EmailService';

interface HandleProposalActionResult {
  success: boolean;
  error?: string;
}

interface ProposalActionData {
  proposal: Proposal;
  job: Job;
  recruiter: User;
  action: 'accept' | 'reject';
}

export class ProposalService {
  async handleProposalAction({
    proposal,
    job,
    recruiter,
    action,
  }: ProposalActionData): Promise<HandleProposalActionResult> {
    const originalStatus = proposal.status;
    const newStatusId = action === 'accept' ? 5 : 6; // ACCEPTED : REJECTED
    
    try {
      // Step 1: Update proposal status in database
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status_id: newStatusId })
        .eq('id', proposal.id);

      if (updateError) {
        throw new Error(`Failed to update proposal status: ${updateError.message}`);
      }

      // Step 2: Send notification
      const notificationType = action === 'accept' ? 'accepted' : 'rejected';
      const notificationContent = action === 'accept'
        ? `Your proposal for "${job.title}" has been accepted! 🎉`
        : `Your proposal for "${job.title}" was not selected this time.`;

      try {
        // Import and use your notification store here
        // This will need to be called from the component where the store is available
        // For now, we'll return the data needed for the notification
        console.log('Notification to send:', {
          targetUserId: proposal.user.id,
          type: notificationType,
          content: notificationContent,
          jobId: job.id,
        });
      } catch (notificationError) {
        console.error('Notification failed:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      // Step 3: Send email
      const companyName = recruiter.role?.name === 'recruiter' 
        ? (recruiter as any).company?.name || 'Unknown Company'
        : 'Unknown Company';

      let emailResult;
      if (action === 'accept') {
        const emailData = emailService.createAcceptanceEmailData(
          proposal,
          job,
          recruiter,
          companyName
        );
        emailResult = await emailService.sendProposalAcceptanceEmail(emailData);
      } else {
        const emailData = emailService.createRejectionEmailData(
          proposal,
          job,
          recruiter,
          companyName
        );
        emailResult = await emailService.sendProposalRejectionEmail(emailData);
      }

      if (!emailResult.success) {
        throw new Error(`Email failed: ${emailResult.error}`);
      }

      return { success: true };

    } catch (error) {
      // Rollback: Revert status back to original
      try {
        await supabase
          .from('job_applications')
          .update({ status_id: originalStatus.id })
          .eq('id', proposal.id);
        
        console.log('Status reverted due to error');
      } catch (rollbackError) {
        console.error('Failed to rollback status:', rollbackError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async reportProposal(proposalId: number): Promise<void> {
    console.log(`Report proposal ${proposalId} - Feature coming soon`);
    // TODO: Implement reporting functionality
    alert('Report feature will be implemented soon');
  }
}

export const proposalService = new ProposalService();