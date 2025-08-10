import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/cron/inbox-sync - iterate enabled accounts and run delta sync
export async function POST(_request: NextRequest) {
  try {
    const enabled = await prisma.accountSyncState.findMany({ where: { isFullSyncEnabled: true } });
    const { runFullSync } = await import('../../../../lib/inbox-sync/run');
    const results = [] as any[];
    for (const s of enabled) {
      try {
        const res = await runFullSync({ accountId: s.accountId, userId: s.userId });
        results.push({ accountId: s.accountId, ok: true, res });
      } catch (e) {
        results.push({ accountId: s.accountId, ok: false, error: (e as Error).message });
      }
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron inbox sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

