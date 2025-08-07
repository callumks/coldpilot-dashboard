import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/email-accounts/[id] - Disconnect a connected email account
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve app user
    const appUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!appUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure the account belongs to this user
    const account = await prisma.connectedEmailAccount.findFirst({
      where: { id: params.id, userId: appUser.id }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Soft-disconnect: deactivate and clear tokens
    await prisma.connectedEmailAccount.update({
      where: { id: params.id },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        lastUsed: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Disconnect email account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}