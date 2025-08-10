import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/conversations - Fetch user's conversations
export async function GET(request: NextRequest) {
  try {
    console.log('💬 Fetch conversations request received');

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
    const search = url.searchParams.get('search') || '';
    const filter = url.searchParams.get('filter') || 'All';
    const sortBy = url.searchParams.get('sortBy') || 'recent';

    // Build filter conditions
    const whereConditions: any = {
      userId: user.id,
      // Only show conversations linked to user-managed contacts (exclude contacts auto-created by inbox sync)
      contact: {
        source: { not: 'EMAIL' }
      }
    };

    // Add search filter
    if (search) {
      whereConditions.OR = [
        { subject: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { preview: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { contact: { 
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { company: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
          ]
        }}
      ];
    }

    // Add status filter
    if (filter === 'Unread') {
      whereConditions.unreadCount = { gt: 0 };
    } else if (filter === 'Replied') {
      whereConditions.status = 'REPLIED';
    } else if (filter === 'Pending') {
      whereConditions.status = { in: ['SENT', 'DELIVERED', 'OPENED'] };
    }

    // Determine sort order
    let orderBy: any = { lastMessageAt: 'desc' }; // Default: most recent
    if (sortBy === 'oldest') {
      orderBy = { lastMessageAt: 'asc' };
    } else if (sortBy === 'unread') {
      orderBy = [{ unreadCount: 'desc' }, { lastMessageAt: 'desc' }];
    } else if (sortBy === 'priority') {
      orderBy = [{ priority: 'desc' }, { lastMessageAt: 'desc' }];
    }

    // Fetch conversations with related data
    const conversations = await prisma.conversation.findMany({
      where: whereConditions,
      include: {
        contact: {
          select: { 
            id: true,
            name: true, 
            email: true, 
            company: true,
            status: true 
          }
        },
        campaign: {
          select: { 
            id: true,
            name: true 
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { 
            content: true, 
            direction: true, 
            sentAt: true,
            isRead: true 
          }
        }
      },
      orderBy,
      take: 50 // Limit to 50 conversations for performance
    });

    console.log('✅ Conversations fetched:', conversations.length);

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conversation => {
        const lastMessage = conversation.messages[0];
        const responseTime = calculateResponseTime(conversation.lastMessageAt);
        
        return {
          id: conversation.id,
          recipientName: conversation.contact.name,
          recipientCompany: conversation.contact.company || 'Unknown Company',
          recipientEmail: conversation.contact.email,
          lastMessage: conversation.preview || (lastMessage?.content.substring(0, 150) + '...' || 'No message content'),
          timestamp: formatTimeAgo(conversation.lastMessageAt),
          status: mapConversationStatus(conversation.status, lastMessage?.direction),
          unreadCount: conversation.unreadCount,
          urgency: calculateUrgency(conversation.priority, responseTime, conversation.contact.status),
          responseTime,
          subject: conversation.subject,
          campaignName: conversation.campaign?.name || null,
          contactStatus: conversation.contact.status
        };
      })
    });

  } catch (error) {
    console.error('💥 Fetch conversations error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

function calculateResponseTime(lastMessageAt: Date): number {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60));
  return diffInHours;
}

function calculateUrgency(priority: string, responseTime: number, contactStatus: string): 'high' | 'medium' | 'low' {
  // High priority conversations or interested/hot contacts
  if (priority === 'HIGH' || priority === 'URGENT') return 'high';
  if (contactStatus === 'INTERESTED' || contactStatus === 'MEETING_SCHEDULED') return 'high';
  
  // Medium priority for recent responses or warm contacts
  if (responseTime <= 24 || contactStatus === 'REPLIED') return 'medium';
  if (priority === 'MEDIUM') return 'medium';
  
  // Low priority for everything else
  return 'low';
}

function mapConversationStatus(status: string, lastMessageDirection?: string): 'replied' | 'sent' | 'opened' | 'delivered' {
  switch (status) {
    case 'REPLIED': return 'replied';
    case 'OPENED': return 'opened';
    case 'DELIVERED': return 'delivered';
    case 'SENT': return 'sent';
    default: return lastMessageDirection === 'OUTBOUND' ? 'sent' : 'replied';
  }
}