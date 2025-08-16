import { NextRequest, NextResponse } from 'next/server';
import { campaignEngine } from '../../../../lib/campaign-engine';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/cron/campaigns - Trigger campaign processing (for Railway cron)
export async function POST(_request: NextRequest) {
  try {
    // Safeguard: ensure ACTIVE campaigns have assigned contacts
    const active = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, userId: true, targetTags: true, excludePrevious: true },
    });

    for (const c of active) {
      const count = await prisma.campaignContact.count({ where: { campaignId: c.id } });
      if (count > 0) continue;

      const where: any = { userId: c.userId };
      if (c.targetTags && c.targetTags.length > 0) where.tags = { hasSome: c.targetTags };
      let candidates = await prisma.contact.findMany({ where, select: { id: true } });
      if (c.excludePrevious) {
        const prior = await prisma.conversation.findMany({ where: { userId: c.userId, contactId: { in: candidates.map(x => x.id) } }, select: { contactId: true } });
        const excluded = new Set(prior.map(p => p.contactId));
        candidates = candidates.filter(ct => !excluded.has(ct.id));
      }
      if (candidates.length > 0) {
        await prisma.campaignContact.createMany({ data: candidates.map(ct => ({ campaignId: c.id, contactId: ct.id })), skipDuplicates: true });
        const total = await prisma.campaignContact.count({ where: { campaignId: c.id } });
        await prisma.campaign.update({ where: { id: c.id }, data: { totalContacts: total } });
      }
    }

    await campaignEngine.processCampaigns();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron run failed:', error);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}

// Optional GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}

