import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/conversations/[id] - Fetch a single conversation with full message list
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        contact: { select: { id: true, name: true, email: true, company: true } },
        messages: {
          orderBy: { sentAt: 'asc' },
          select: { id: true, content: true, direction: true, sentAt: true, isRead: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        subject: conversation.subject,
        contact: conversation.contact,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error('💥 Fetch conversation detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

