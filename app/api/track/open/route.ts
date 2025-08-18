import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// 1x1 transparent PNG
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('m');
    if (!messageId) {
      return new Response(PIXEL, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
    }

    // Mark message opened (idempotent) and log event
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (message) {
      if (!message.openedAt) {
        await prisma.message.update({ where: { id: message.id }, data: { openedAt: new Date() } });
      }
      if (message.conversation?.campaignId && message.conversation?.contactId) {
        try {
          await (prisma as any).campaignEvent.create({
            data: {
              campaignId: message.conversation.campaignId,
              contactId: message.conversation.contactId,
              eventType: 'EMAIL_OPENED',
              stepNumber: null,
              metadata: { messageId: message.id },
            },
          });
        } catch {}
      }
    }

    return new Response(PIXEL, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  } catch {
    return new Response(PIXEL, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  }
}

