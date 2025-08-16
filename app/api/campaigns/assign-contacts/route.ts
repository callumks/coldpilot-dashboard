import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/campaigns/assign-contacts
// Body: { campaignId: string, contactIds?: string[] } — if contactIds omitted, assign all matching
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { campaignId, contactIds } = body || {};
    if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });

    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let candidates: { id: string }[];
    if (Array.isArray(contactIds) && contactIds.length > 0) {
      candidates = await prisma.contact.findMany({ where: { id: { in: contactIds }, userId: user.id }, select: { id: true } });
    } else {
      const where: any = { userId: user.id };
      if (campaign.targetTags && campaign.targetTags.length > 0) where.tags = { hasSome: campaign.targetTags };
      candidates = await prisma.contact.findMany({ where, select: { id: true } });
      if (campaign.excludePrevious && candidates.length > 0) {
        const prior = await prisma.conversation.findMany({ where: { userId: user.id, contactId: { in: candidates.map(c => c.id) } }, select: { contactId: true } });
        const excluded = new Set(prior.map(p => p.contactId));
        candidates = candidates.filter(c => !excluded.has(c.id));
      }
    }

    if (candidates.length === 0) return NextResponse.json({ success: true, assigned: 0 });

    const already = await prisma.campaignContact.findMany({ where: { campaignId }, select: { contactId: true } });
    const assigned = new Set(already.map(a => a.contactId));
    const toAssign = candidates.filter(c => !assigned.has(c.id));

    if (toAssign.length === 0) return NextResponse.json({ success: true, assigned: 0 });

    const res = await prisma.campaignContact.createMany({ data: toAssign.map(c => ({ campaignId, contactId: c.id })), skipDuplicates: true });
    const total = await prisma.campaignContact.count({ where: { campaignId } });
    await prisma.campaign.update({ where: { id: campaignId }, data: { totalContacts: total } });

    return NextResponse.json({ success: true, assigned: res.count, total });
  } catch (error) {
    console.error('Assign contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

