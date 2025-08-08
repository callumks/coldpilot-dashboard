import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/contacts/[id]/status - Update a contact's status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { status } = await request.json();
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    const updated = await prisma.contact.update({
      where: { id: params.id, userId: user.id },
      data: {
        status: status,
        ...(status === 'CONTACTED' && { lastContacted: new Date() })
      }
    });

    return NextResponse.json({ success: true, contact: { id: updated.id, status: updated.status, lastContacted: updated.lastContacted } });
  } catch (error) {
    console.error('Update contact status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

