import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ accountId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const { accountId } = parsed.data;
    const account = await (prisma as any).connectedEmailAccount.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    // For now, run inline (can enqueue to a queue later)
    const { runFullSync } = await import('../../../../lib/inbox-sync/run');
    const result = await runFullSync({ accountId, userId: user.id });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Run sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

