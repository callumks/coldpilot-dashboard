import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/campaigns - Fetch user's campaigns
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetch campaigns request received');

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 User authenticated:', userId);

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's campaigns with related data
    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        contacts: {
          include: {
            contact: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            contacts: true,
            conversations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('✅ Campaigns fetched:', campaigns.length);

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        channel: campaign.channel,
        totalContacts: campaign.totalContacts,
        emailsSent: campaign.emailsSent,
        emailsDelivered: campaign.emailsDelivered,
        emailsOpened: campaign.emailsOpened,
        emailsReplied: campaign.emailsReplied,
        emailsBounced: campaign.emailsBounced,
        openRate: campaign.openRate,
        replyRate: campaign.replyRate,
        bounceRate: campaign.bounceRate,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        steps: campaign.steps.length,
        contactsCount: campaign._count.contacts,
        conversationsCount: campaign._count.conversations
      }))
    });

  } catch (error) {
    console.error('💥 Fetch campaigns error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns - Update campaign status or fields
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { id, status, name, description } = body || {};
    if (!id) return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });

    // Only allow updating owned campaign
    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof name === 'string' ? { name } : {}),
        ...(typeof description === 'string' ? { description } : {}),
      }
    });
    return NextResponse.json({ success: true, campaign: { id: updated.id, status: updated.status, name: updated.name, description: updated.description } });
  } catch (error) {
    console.error('💥 Update campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns?id=... - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const existing = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Delete campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}