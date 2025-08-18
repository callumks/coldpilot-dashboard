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
    const results: Array<{ campaignId: string; totalContacts: number; emailsSent: number; emailsDelivered: number; emailsOpened: number; emailsReplied: number; openRate: number; replyRate: number; bounceRate: number }> = [];

    for (const c of campaigns) {
      const totalContacts = await prisma.campaignContact.count({ where: { campaignId: c.id } });
      const messages = await prisma.message.findMany({ where: { conversation: { campaignId: c.id } }, select: { deliveredAt: true, openedAt: true } });
      const emailsSent = messages.length;
      const emailsDelivered = messages.filter(m => !!m.deliveredAt).length;
      const emailsOpened = messages.filter(m => !!m.openedAt).length;
      const emailsReplied = 0;
      const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
      const replyRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;
      const bounceRate = 0;

      await prisma.campaign.update({
        where: { id: c.id },
        data: {
          totalContacts,
          emailsSent,
          emailsDelivered,
          emailsOpened,
          emailsReplied,
          openRate,
          replyRate,
          bounceRate,
          updatedAt: new Date(),
        },
      });

      results.push({ campaignId: c.id, totalContacts, emailsSent, emailsDelivered, emailsOpened, emailsReplied, openRate, replyRate, bounceRate });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Recompute failed', error);
    return NextResponse.json({ error: 'Recompute failed' }, { status: 500 });
  }
}

