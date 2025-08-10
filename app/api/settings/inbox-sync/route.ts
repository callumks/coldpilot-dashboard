import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  accountId: z.string().min(1),
  isFullSyncEnabled: z.boolean().optional(),
  excludedDomains: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { accountId, isFullSyncEnabled, excludedDomains } = parsed.data;

    // Ensure the account belongs to the user
    const account = await (prisma as any).connectedEmailAccount.findFirst({ where: { id: accountId, userId: user.id } });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const state = await prisma.accountSyncState.upsert({
      where: { accountId },
      update: {
        ...(typeof isFullSyncEnabled === 'boolean' ? { isFullSyncEnabled } : {}),
        ...(excludedDomains ? { excludedDomains } : {})
      },
      create: {
        userId: user.id,
        accountId,
        provider: account.provider,
        isFullSyncEnabled: isFullSyncEnabled ?? false,
        excludedDomains: excludedDomains ?? []
      }
    });

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Inbox sync settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

