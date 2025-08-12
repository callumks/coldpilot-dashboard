import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/dashboard - Fetch dashboard statistics and recent conversations
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetch dashboard stats request received');

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

    // Ensure user exists in DB (auto-create on first access)
    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get campaign filter from query params
    const url = new URL(request.url);
    const campaignFilter = url.searchParams.get('campaign') || 'all';

    // Build campaign filter condition
    const campaignWhere = campaignFilter === 'all' ? {} : { 
      name: { contains: campaignFilter, mode: Prisma.QueryMode.insensitive } 
    };

    // Get campaigns for stats calculation
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        ...campaignWhere
      },
      select: {
        id: true,
        name: true,
        emailsSent: true,
        emailsOpened: true,
        emailsReplied: true,
        totalContacts: true,
        openRate: true,
        replyRate: true
      }
    });

    // Calculate aggregate stats
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalEmailsOpened = campaigns.reduce((sum, c) => sum + c.emailsOpened, 0);
    const totalEmailsReplied = campaigns.reduce((sum, c) => sum + c.emailsReplied, 0);
    
    const openRate = totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent) * 100 : 0;
    const replyRate = totalEmailsSent > 0 ? (totalEmailsReplied / totalEmailsSent) * 100 : 0;

    // Get recent conversations (last 10)
    const recentConversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        contact: {
          select: { name: true, email: true, company: true }
        },
        campaign: {
          select: { name: true }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { content: true, direction: true, sentAt: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10
    });

    // Get meetings count (conversations with status MEETING_SCHEDULED)
    const meetingsCount = await prisma.contact.count({
      where: {
        userId: user.id,
        status: 'MEETING_SCHEDULED'
      }
    });

    // Get available campaigns for filter dropdown
    const allCampaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate change percentages (mock for now - would need historical data)
    const mockChangeCalculation = (value: number) => {
      const change = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
      return {
        value: Math.round(change * 10) / 10,
        trend: change >= 0 ? 'up' : 'down'
      };
    };

    const openRateChange = mockChangeCalculation(openRate);
    const meetingsChange = mockChangeCalculation(meetingsCount);
    const repliesChange = mockChangeCalculation(totalEmailsReplied);

    console.log('✅ Dashboard stats calculated');

    return NextResponse.json({
      success: true,
      stats: {
        openRate: {
          value: `${openRate.toFixed(1)}%`,
          change: `${openRateChange.value >= 0 ? '+' : ''}${openRateChange.value}%`,
          trend: openRateChange.trend,
          description: 'Percentage of recipients who opened your emails. Industry average is 22%.'
        },
        meetingsBooked: {
          value: meetingsCount.toString(),
          change: `${meetingsChange.value >= 0 ? '+' : ''}${Math.abs(Math.round(meetingsChange.value))}`,
          trend: meetingsChange.trend,
          description: 'Total number of meetings scheduled through your outreach campaigns this month.'
        },
        replies: {
          value: totalEmailsReplied.toLocaleString(),
          change: `${repliesChange.value >= 0 ? '+' : ''}${repliesChange.value}%`,
          trend: repliesChange.trend,
          description: 'Total email replies received. A slight decrease is normal as campaigns mature.'
        }
      },
      recentConversations: recentConversations.map(conversation => {
        const lastMessageContent = conversation.messages?.[0]?.content || '';
        const preview = conversation.preview || (lastMessageContent ? `${lastMessageContent.substring(0, 100)}...` : 'No preview available');

        return {
          id: conversation.id,
          sender: conversation.contact.name,
          company: conversation.contact.company || 'Unknown Company',
          subject: conversation.subject,
          preview,
          time: formatTimeAgo(conversation.lastMessageAt),
          isUnread: conversation.unreadCount > 0,
          status: getConversationStatus(conversation.status, conversation.messages?.[0]?.direction)
        };
      }),
      campaigns: allCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      }))
    });

  } catch (error) {
    console.error('💥 Fetch dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

// Helper function to determine conversation status
function getConversationStatus(status: string, lastMessageDirection?: string): string {
  if (status === 'REPLIED') return 'replied';
  if (status === 'OPENED') return 'opened';
  if (lastMessageDirection === 'OUTBOUND') return 'sent';
  return 'no_response';
}