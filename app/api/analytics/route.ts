import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/analytics - Fetch analytics and performance metrics
export async function GET(request: NextRequest) {
  try {
    console.log('📈 Fetch analytics request received');

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

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get campaigns within the period
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        status: true,
        emailsSent: true,
        emailsDelivered: true,
        emailsOpened: true,
        emailsReplied: true,
        emailsBounced: true,
        totalContacts: true,
        openRate: true,
        replyRate: true,
        bounceRate: true,
        createdAt: true
      }
    });

    // Calculate aggregate metrics
    const totalSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.emailsOpened, 0);
    const totalReplied = campaigns.reduce((sum, c) => sum + c.emailsReplied, 0);
    const totalBounced = campaigns.reduce((sum, c) => sum + c.emailsBounced, 0);

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Get meetings scheduled (contacts with MEETING_SCHEDULED status)
    const meetingsCount = await prisma.contact.count({
      where: {
        userId: user.id,
        status: 'MEETING_SCHEDULED',
        updatedAt: { gte: startDate }
      }
    });

    const meetingRate = totalSent > 0 ? (meetingsCount / totalSent) * 100 : 0;

    // Calculate average response time from conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        lastMessageAt: { gte: startDate }
      },
      select: {
        responseTime: true,
        status: true
      }
    });

    const avgResponseTime = conversations.length > 0 
      ? conversations.filter(c => c.responseTime).reduce((sum, c) => sum + (c.responseTime || 0), 0) / conversations.length
      : 0;

    // Get active campaigns count
    const activeCampaigns = await prisma.campaign.count({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    // Calculate change percentages (simplified - would need historical data for real calculations)
    const calculateChange = (current: number) => {
      // Simulate change calculation with random values for demo
      const change = (Math.random() - 0.5) * 10; // -5% to +5%
      return {
        value: Math.round(change * 10) / 10,
        trend: change >= 0 ? 'up' : 'down'
      };
    };

    // Industry benchmarks
    const benchmarks = [
      { 
        metric: 'Open Rate', 
        yourValue: parseFloat(openRate.toFixed(1)), 
        industryAvg: 22.0, 
        isAbove: openRate > 22.0 
      },
      { 
        metric: 'Reply Rate', 
        yourValue: parseFloat(replyRate.toFixed(1)), 
        industryAvg: 5.1, 
        isAbove: replyRate > 5.1 
      },
      { 
        metric: 'Meeting Rate', 
        yourValue: parseFloat(meetingRate.toFixed(1)), 
        industryAvg: 2.1, 
        isAbove: meetingRate > 2.1 
      },
    ];

    // Find top performing campaign
    const topCampaign = campaigns.length > 0 
      ? campaigns.reduce((best, current) => 
          current.replyRate > best.replyRate ? current : best
        )
      : null;

    // Generate metrics with changes
    const sentChange = calculateChange(totalSent);
    const openRateChange = calculateChange(openRate);
    const replyRateChange = calculateChange(replyRate);
    const meetingRateChange = calculateChange(meetingRate);
    const responseTimeChange = calculateChange(avgResponseTime);
    const campaignsChange = calculateChange(activeCampaigns);

    console.log('✅ Analytics calculated');

    return NextResponse.json({
      success: true,
      metrics: [
        {
          title: 'Total Sent',
          value: totalSent.toLocaleString(),
          change: `${sentChange.value >= 0 ? '+' : ''}${sentChange.value}%`,
          trend: sentChange.trend,
          description: 'Total emails sent across all campaigns this period.'
        },
        {
          title: 'Open Rate',
          value: `${openRate.toFixed(1)}%`,
          change: `${openRateChange.value >= 0 ? '+' : ''}${openRateChange.value}%`,
          trend: openRateChange.trend,
          description: 'Percentage of recipients who opened your emails. Industry average: 22%.'
        },
        {
          title: 'Reply Rate',
          value: `${replyRate.toFixed(1)}%`,
          change: `${replyRateChange.value >= 0 ? '+' : ''}${replyRateChange.value}%`,
          trend: replyRateChange.trend,
          description: 'Percentage of emails that received replies. Industry average: 5.1%.'
        },
        {
          title: 'Meeting Rate',
          value: `${meetingRate.toFixed(1)}%`,
          change: `${meetingRateChange.value >= 0 ? '+' : ''}${meetingRateChange.value}%`,
          trend: meetingRateChange.trend,
          description: 'Percentage of emails that resulted in booked meetings. Industry average: 2.1%.'
        },
        {
          title: 'Avg Response Time',
          value: `${avgResponseTime.toFixed(1)}h`,
          change: `${responseTimeChange.value >= 0 ? '+' : ''}${Math.abs(responseTimeChange.value)}h`,
          trend: responseTimeChange.trend === 'down' ? 'up' : 'down', // Lower response time is better
          description: 'Average time between sending and receiving a reply.'
        },
        {
          title: 'Active Campaigns',
          value: activeCampaigns.toString(),
          change: `${campaignsChange.value >= 0 ? '+' : ''}${Math.abs(Math.round(campaignsChange.value))}`,
          trend: campaignsChange.trend,
          description: 'Number of currently running outreach campaigns.'
        }
      ],
      benchmarks,
      topCampaign: topCampaign ? {
        name: topCampaign.name,
        openRate: topCampaign.openRate,
        replyRate: topCampaign.replyRate,
        emailsSent: topCampaign.emailsSent
      } : null,
      period,
      periodLabel: getPeriodLabel(period)
    });

  } catch (error) {
    console.error('💥 Fetch analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get period label
function getPeriodLabel(period: string): string {
  switch (period) {
    case '7d': return 'Last 7 days';
    case '30d': return 'Last 30 days';
    case '90d': return 'Last 90 days';
    case '1y': return 'Last year';
    default: return 'Last 30 days';
  }
}