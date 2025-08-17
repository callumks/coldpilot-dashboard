import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/campaigns/recompute — recompute aggregate stats for the user's campaigns
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const campaigns = await prisma.campaign.findMany({ where: { userId: user.id }, select: { id: true } });
    const results: Array<{ campaignId: string; totalContacts: number; emailsSent: number; emailsDelivered: number }> = [];

    for (const c of campaigns) {
      const totalContacts = await prisma.campaignContact.count({ where: { campaignId: c.id } });
      const messages = await prisma.message.findMany({ where: { conversation: { campaignId: c.id } }, select: { deliveredAt: true } });
      const emailsSent = messages.length;
      const emailsDelivered = messages.filter(m => !!m.deliveredAt).length;

      await prisma.campaign.update({
        where: { id: c.id },
        data: {
          totalContacts,
          emailsSent,
          emailsDelivered,
          // derived rates left as-is for now
          updatedAt: new Date(),
        },
      });

      results.push({ campaignId: c.id, totalContacts, emailsSent, emailsDelivered });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Recompute failed', error);
    return NextResponse.json({ error: 'Recompute failed' }, { status: 500 });
  }
}

