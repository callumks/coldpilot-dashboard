import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { enqueueSend } from '../../../../scripts/setup-queue';

export const dynamic = 'force-dynamic';

// GET /api/queue/smoke — enqueues one test job for the first ACTIVE campaign/contact
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const campaign = await prisma.campaign.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { steps: { where: { isActive: true }, orderBy: { stepNumber: 'asc' } } },
    });
    if (!campaign) return NextResponse.json({ error: 'No ACTIVE campaign' }, { status: 404 });
    const step1 = campaign.steps.find(s => s.stepNumber === 1);
    if (!step1) return NextResponse.json({ error: 'No active step 1 in campaign' }, { status: 400 });

    // Find or create an assignment
    let assignment = await prisma.campaignContact.findFirst({ where: { campaignId: campaign.id } });
    if (!assignment) {
      const contact = await prisma.contact.findFirst({ where: { userId: user.id } });
      if (!contact) return NextResponse.json({ error: 'No contacts to assign' }, { status: 400 });
      assignment = await prisma.campaignContact.create({ data: { campaignId: campaign.id, contactId: contact.id } });
      await prisma.campaign.update({ where: { id: campaign.id }, data: { totalContacts: { increment: 1 } } });
    }

    await enqueueSend({ campaignId: campaign.id, contactId: assignment.contactId, stepNumber: 1, fromAccountId: (campaign as any).fromAccountId });
    return NextResponse.json({ queued: true, campaignId: campaign.id, contactId: assignment.contactId, stepNumber: 1 });
  } catch (error) {
    console.error('Smoke enqueue failed', error);
    return NextResponse.json({ error: 'Smoke failed' }, { status: 500 });
  }
}

