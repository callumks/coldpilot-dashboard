import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/email-accounts - list connected email accounts for current user
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!appUser) {
      return NextResponse.json({ accounts: [] });
    }

    const accounts = await prisma.connectedEmailAccount.findMany({
      where: { userId: appUser.id, isActive: true },
      select: { id: true, email: true, provider: true }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('💥 List email accounts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}