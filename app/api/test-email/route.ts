import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import universalSender from '../../../lib/email/universal-sender';

export const dynamic = 'force-dynamic';

// POST /api/test-email - send a test email to a specified address without touching real contacts
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { to, subject = 'Coldpilot Test Email', html = '<p>This is a test email from Coldpilot.</p>', fromAccountId } = body;
    if (!to) return NextResponse.json({ error: 'Missing "to" address' }, { status: 400 });

    const result = await universalSender.sendEmail({
      userId: user.id,
      to,
      subject,
      body: html,
      fromName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Coldpilot',
      fromAccountId,
    });

    return NextResponse.json({ success: result.success, error: result.error });
  } catch (error) {
    console.error('💥 Test email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}