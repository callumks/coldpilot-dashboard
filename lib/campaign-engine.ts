// Campaign Execution Engine
// Handles automated campaign execution, scheduling, and email sending

import { prisma } from './prisma';
import universalSender from './email/universal-sender';

export interface CampaignExecution {
  campaignId: string;
  contactId: string;
  stepNumber: number;
  scheduledAt: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
}

export interface CampaignStats {
  campaignId: string;
  totalContacts: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsReplied: number;
  emailsBounced: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
}

class CampaignEngine {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;

  // Start the campaign engine
  start() {
    if (this.isRunning) {
      console.log('⚠️ Campaign engine is already running');
      return;
    }

    console.log('🚀 Starting campaign execution engine');
    this.isRunning = true;
    
    // Process campaigns every minute
    this.processingInterval = setInterval(() => {
      this.processCampaigns().catch(error => {
        console.error('💥 Campaign processing error:', error);
      });
    }, 60 * 1000); // 1 minute

    // Initial run
    this.processCampaigns().catch(error => {
      console.error('💥 Initial campaign processing error:', error);
    });
  }

  // Stop the campaign engine
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Campaign engine is not running');
      return;
    }

    console.log('🛑 Stopping campaign execution engine');
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Process all active campaigns
  async processCampaigns() {
    try {
      console.log('🔄 Processing active campaigns...');

      // Get all active campaigns
      const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        include: {
          steps: {
            where: { isActive: true },
            orderBy: { stepNumber: 'asc' }
          },
          contacts: {
            include: {
              contact: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`📋 Found ${activeCampaigns.length} active campaigns`);

      for (const campaign of activeCampaigns) {
        await this.processCampaign(campaign);
      }

      console.log('✅ Campaign processing completed');
    } catch (error) {
      console.error('💥 Error processing campaigns:', error);
    }
  }

  // Process a single campaign
  private async processCampaign(campaign: any) {
    try {
      console.log(`📧 Processing campaign: ${campaign.name}`);

      const now = new Date();
      const campaignContacts = campaign.contacts;
      
      // Check sending window and daily limits
      if (!this.isInSendingWindow(campaign, now)) {
        console.log(`⏰ Campaign ${campaign.name} is outside sending window`);
        return;
      }

      // Get today's email count for this campaign
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const todayEmailCount = await prisma.message.count({
        where: {
          conversation: {
            campaignId: campaign.id
          },
          sentAt: {
            gte: startOfDay
          }
        }
      });

      if (todayEmailCount >= campaign.dailySendLimit) {
        console.log(`📊 Campaign ${campaign.name} has reached daily send limit (${campaign.dailySendLimit})`);
        return;
      }

      let emailsSentToday = todayEmailCount;

      // Process each contact in the campaign
      for (const campaignContact of campaignContacts) {
        if (emailsSentToday >= campaign.dailySendLimit) {
          console.log(`📊 Daily send limit reached for campaign ${campaign.name}`);
          break;
        }

        const contact = campaignContact.contact;
        
        // Find the next step for this contact
        const nextStep = await this.getNextStepForContact(campaign, contact);
        
        if (!nextStep) {
          continue; // No more steps for this contact
        }

        // Check if it's time to send this step
        const shouldSend = await this.shouldSendStep(campaign, contact, nextStep);
        
        if (!shouldSend) {
          continue;
        }

       // Enqueue the email via queue worker
       try {
         const { enqueueSend } = await import('../scripts/setup-queue');
         console.log(`🧵 Enqueue send: campaign=${campaign.id} contact=${contact.id} step=${nextStep.stepNumber}`);
         // Pace sends to avoid burst: spread within the minute based on current count
         const spreadMs = Math.min(55000, (emailsSentToday % 30) * 1500);
         await enqueueSend({ campaignId: campaign.id, contactId: contact.id, stepNumber: nextStep.stepNumber, fromAccountId: (campaign as any).fromAccountId }, { delayMs: spreadMs });
         console.log(`✅ Enqueued: campaign=${campaign.id} contact=${contact.id} step=${nextStep.stepNumber}`);
       } catch (e) {
         console.error('Queue enqueue failed, falling back to direct send', e);
         const sent = await this.sendCampaignEmail(campaign, contact, nextStep);
         if (sent) {
           emailsSentToday++;
         }
         await new Promise(resolve => setTimeout(resolve, 1000));
         continue;
       }
        
       emailsSentToday++;

       // Queue-based throttling; no local delay needed
      }

      // Update campaign statistics
      await this.updateCampaignStats(campaign.id);

    } catch (error) {
      console.error(`💥 Error processing campaign ${campaign.name}:`, error);
    }
  }

  // Check if campaign is in its sending window
  private isInSendingWindow(campaign: any, now: Date): boolean {
    const sendingWindow = campaign.sendingWindow;
    const tz = campaign.timezone || 'UTC';
    // Convert now to campaign timezone using Intl (approx by formatting hours/minutes)
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
    const parts = fmt.formatToParts(now);
    const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const wdStr = parts.find(p => p.type === 'weekday')?.value || 'Mon';
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wdStr);
    
    if (!sendingWindow) return true;

    // Check weekdays only setting
    if (sendingWindow.weekdaysOnly) {
      if (dow === 0 || dow === 6) return false;
    }

    // Check time window based on localized hours/minutes
    const currentTime = hh * 100 + mm;
    const startTime = parseInt(sendingWindow.start.replace(':', ''));
    const endTime = parseInt(sendingWindow.end.replace(':', ''));

    return currentTime >= startTime && currentTime <= endTime;
  }

  // Get the next step for a contact in a campaign
  private async getNextStepForContact(campaign: any, contact: any) {
    // Determine next step based on prior send attempts for this campaign/contact
    const lastAttempt = await (prisma as any).sendAttempt.findFirst({
      where: { campaignId: campaign.id, contactId: contact.id },
      orderBy: { stepNumber: 'desc' }
    });

    const nextStepNumber = (lastAttempt?.stepNumber ?? 0) + 1;
    const step = campaign.steps.find((s: any) => s.stepNumber === nextStepNumber);
    return step;
  }

  // Check if a step should be sent now
  private async shouldSendStep(campaign: any, contact: any, step: any): Promise<boolean> {
    if (step.stepNumber === 1) {
      // First step can be sent immediately
      return true;
    }

    // For follow-up steps, check delay
    const conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        campaignId: campaign.id
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    });

    if (!conversation || conversation.messages.length === 0) {
      return false; // No previous messages
    }

    const lastMessage = conversation.messages[0];
    const daysSinceLastMessage = Math.floor(
      (Date.now() - lastMessage.sentAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastMessage >= step.delayDays;
  }

  // Send a campaign email
  private async sendCampaignEmail(campaign: any, contact: any, step: any): Promise<boolean> {
    try {
      console.log(`📧 Sending step ${step.stepNumber} to ${contact.email} for campaign ${campaign.name}`);

      // Create or get conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          contactId: contact.id,
          campaignId: campaign.id
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            campaignId: campaign.id,
            userId: campaign.userId,
            subject: this.personalizeContent(step.subject || campaign.name, contact),
            status: 'SENT',
            lastMessageAt: new Date(),
            unreadCount: 0
          }
        });
      }

      // Create message record
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          content: this.personalizeContent(step.body || '', contact),
          sentAt: new Date()
        }
      });

      // Send email using universal email service
      const emailResult = await universalSender.sendEmail({
        userId: campaign.userId,
        to: contact.email,
        toName: contact.name,
        fromEmail: '', // Will be determined by universal sender
        fromName: `${campaign.user.firstName} ${campaign.user.lastName}`,
        subject: this.personalizeContent(step.subject || campaign.name, contact),
        body: this.personalizeContent(step.body || '', contact),
        messageId: message.id,
        campaignId: campaign.id,
        contactId: contact.id,
        fromAccountId: campaign.fromAccountId || undefined,
        overrideToEmail: campaign.recipientOverride || undefined
      });

      // Update message status
      await prisma.message.update({
        where: { id: message.id },
        data: {
          deliveredAt: emailResult.success ? new Date() : null
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          // Only update status to SENT if email was successful
          ...(emailResult.success && { status: 'SENT' })
        }
      });

      // Update contact
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          status: 'CONTACTED',
          lastContacted: new Date()
        }
      });

      return emailResult.success;

    } catch (error) {
      console.error(`💥 Error sending campaign email:`, error);
      return false;
    }
  }

  // Personalize email content
  private personalizeContent(template: string, contact: any): string {
    if (!template) return '';
    
    return template
      .replace(/\[firstName\]/g, contact.name.split(' ')[0] || contact.name)
      .replace(/\[lastName\]/g, contact.name.split(' ').slice(1).join(' ') || '')
      .replace(/\[name\]/g, contact.name)
      .replace(/\[company\]/g, contact.company || 'your company')
      .replace(/\[email\]/g, contact.email)
      .replace(/\[position\]/g, contact.position || '');
  }

  // Update campaign statistics
  private async updateCampaignStats(campaignId: string) {
    try {
      const stats = await this.calculateCampaignStats(campaignId);
      
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          totalContacts: stats.totalContacts,
          emailsSent: stats.emailsSent,
          emailsDelivered: stats.emailsDelivered,
          emailsOpened: stats.emailsOpened,
          emailsReplied: stats.emailsReplied,
          emailsBounced: stats.emailsBounced,
          openRate: stats.openRate,
          replyRate: stats.replyRate,
          bounceRate: stats.bounceRate,
          updatedAt: new Date()
        }
      });

      console.log(`📊 Updated stats for campaign ${campaignId}`);
    } catch (error) {
      console.error(`💥 Error updating campaign stats for ${campaignId}:`, error);
    }
  }

  // Calculate campaign statistics
  private async calculateCampaignStats(campaignId: string): Promise<CampaignStats> {
    const totalContacts = await prisma.campaignContact.count({
      where: { campaignId }
    });

    const messages = await prisma.message.findMany({
      where: {
        conversation: { campaignId }
      }
    });

    const emailsSent = messages.length; // each created message is a send attempt
    const emailsDelivered = messages.filter(m => !!m.deliveredAt).length;
    const emailsBounced = 0; // not tracked yet

    // These would need webhook integrations from email providers
    const emailsOpened = 0; // TODO: Track from email provider webhooks
    const emailsReplied = 0; // TODO: Track from conversation replies

    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    const replyRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;
    const bounceRate = emailsSent > 0 ? (emailsBounced / emailsSent) * 100 : 0;

    return {
      campaignId,
      totalContacts,
      emailsSent,
      emailsDelivered,
      emailsOpened,
      emailsReplied,
      emailsBounced,
      openRate,
      replyRate,
      bounceRate
    };
  }

  // Manual campaign execution for testing
  async executeCampaign(campaignId: string) {
    console.log(`🎯 Manually executing campaign: ${campaignId}`);
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        steps: {
          where: { isActive: true },
          orderBy: { stepNumber: 'asc' }
        },
        contacts: {
          include: { contact: true }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    await this.processCampaign(campaign);
  }
}

// Export singleton instance
export const campaignEngine = new CampaignEngine();