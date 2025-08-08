import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

interface CampaignStep {
  stepNumber: number;
  name: string;
  delayDays: number;
  isActive: boolean;
  subject: string;
  body: string;
}

interface CreateCampaignRequest {
  name: string;
  description?: string;
  channel: 'EMAIL' | 'SMS' | 'TELEGRAM';
  targetTags: string[];
  minLeadScore: string;
  excludePrevious: boolean;
  dailySendLimit: number;
  sendingWindow: {
    start: string;
    end: string;
    weekdaysOnly: boolean;
  };
  timezone: string;
  steps: CampaignStep[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Create campaign request received');

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 User authenticated:', userId);

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const campaignData: CreateCampaignRequest = await request.json();

    // Validate required fields
    if (!campaignData.name || !campaignData.name.trim()) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    if (!campaignData.steps || campaignData.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one campaign step is required' },
        { status: 400 }
      );
    }

    // Validate all steps have required content
    for (const step of campaignData.steps) {
      if (!step.subject || !step.subject.trim()) {
        return NextResponse.json(
          { error: `Step ${step.stepNumber} is missing a subject` },
          { status: 400 }
        );
      }
      if (!step.body || !step.body.trim()) {
        return NextResponse.json(
          { error: `Step ${step.stepNumber} is missing email content` },
          { status: 400 }
        );
      }
    }

    console.log('✅ Campaign data validated');

    // Create the campaign with steps in a transaction
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Create the campaign
      const campaign = await tx.campaign.create({
        data: {
          name: campaignData.name.trim(),
          description: campaignData.description?.trim() || null,
          channel: campaignData.channel,
          targetTags: campaignData.targetTags,
          minLeadScore: campaignData.minLeadScore,
          excludePrevious: campaignData.excludePrevious,
          dailySendLimit: campaignData.dailySendLimit,
          sendingWindow: campaignData.sendingWindow,
          timezone: campaignData.timezone,
          status: 'DRAFT',
          userId: user.id,
        }
      });

      // Create campaign steps
      const steps = await Promise.all(
        campaignData.steps.map((stepData) =>
          tx.campaignStep.create({
            data: {
              campaignId: campaign.id,
              stepNumber: stepData.stepNumber,
              name: stepData.name,
              delayDays: stepData.delayDays,
              isActive: stepData.isActive,
              // Store email content directly in the step for now
              subject: stepData.subject,
              body: stepData.body,
            }
          })
        )
      );

      return { campaign, steps };
    });

    console.log('✅ Campaign created:', newCampaign.campaign.id);

    return NextResponse.json({
      success: true,
      campaign: {
        id: newCampaign.campaign.id,
        name: newCampaign.campaign.name,
        description: newCampaign.campaign.description,
        status: newCampaign.campaign.status,
        channel: newCampaign.campaign.channel,
        totalContacts: newCampaign.campaign.totalContacts,
        emailsSent: newCampaign.campaign.emailsSent,
        emailsOpened: newCampaign.campaign.emailsOpened,
        emailsReplied: newCampaign.campaign.emailsReplied,
        openRate: newCampaign.campaign.openRate,
        replyRate: newCampaign.campaign.replyRate,
        createdAt: newCampaign.campaign.createdAt,
        steps: newCampaign.steps.length
      }
    });

  } catch (error) {
    console.error('💥 Create campaign error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}