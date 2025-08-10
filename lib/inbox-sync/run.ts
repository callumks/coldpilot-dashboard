import { prisma } from '../prisma';

export async function runFullSync(params: { accountId: string; userId: string }) {
  const { accountId, userId } = params;
  const account = await (prisma as any).connectedEmailAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error('Account not found');

  const state = await prisma.accountSyncState.findUnique({ where: { accountId } });
  if (!state || !state.isFullSyncEnabled) return { skipped: true, reason: 'Sync disabled' };

  const lookbackDays = parseInt(process.env.INBOX_SYNC_LOOKBACK_DAYS || '14', 10);
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  if (account.provider === 'GMAIL') {
    const { syncGmail } = await import('./syncGmail');
    const res = await syncGmail({ account, state, since });
    await prisma.accountSyncState.update({ where: { accountId }, data: { lastSyncedAt: new Date() } });
    return res;
  }
  if (account.provider === 'OUTLOOK') {
    const { syncOutlook } = await import('./syncOutlook');
    const res = await syncOutlook({ account, state, since });
    await prisma.accountSyncState.update({ where: { accountId }, data: { lastSyncedAt: new Date() } });
    return res;
  }
  return { skipped: true, reason: 'Unsupported provider' };
}

