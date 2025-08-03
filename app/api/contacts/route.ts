import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/contacts - Fetch user's contacts
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetch contacts request received');

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

    // Parse query parameters for filtering/searching
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const source = url.searchParams.get('source') || '';

    // Build filter conditions
    const whereConditions: any = {
      userId: user.id,
    };

    // Add search filter
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } } // Search in tags array
      ];
    }

    // Add status filter
    if (status && status !== 'All') {
      whereConditions.status = status.toUpperCase();
    }

    // Add source filter
    if (source && source !== 'All') {
      whereConditions.source = source.toUpperCase();
    }

    // Fetch contacts with filtering
    const contacts = await prisma.contact.findMany({
      where: whereConditions,
      include: {
        campaignContacts: {
          include: {
            campaign: {
              select: { name: true, status: true }
            }
          }
        },
        conversations: {
          select: { 
            id: true, 
            status: true, 
            lastMessageAt: true 
          },
          orderBy: { lastMessageAt: 'desc' },
          take: 1 // Most recent conversation
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get lead source statistics
    const leadSourceStats = await prisma.contact.groupBy({
      by: ['source'],
      where: { userId: user.id },
      _count: { source: true }
    });

    // Calculate total for percentages
    const totalContacts = contacts.length;
    const leadSources = leadSourceStats.map(stat => ({
      source: stat.source,
      count: stat._count.source,
      percentage: totalContacts > 0 ? Math.round((stat._count.source / totalContacts) * 100) : 0
    }));

    console.log('✅ Contacts fetched:', contacts.length);

    return NextResponse.json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        position: contact.position,
        source: contact.source,
        status: contact.status,
        lastContacted: contact.lastContacted,
        tags: contact.tags,
        notes: contact.notes,
        linkedinUrl: contact.linkedinUrl,
        phoneNumber: contact.phoneNumber,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        // Additional computed fields
        activeCampaigns: contact.campaignContacts?.length || 0,
        lastConversation: contact.conversations[0] || null
      })),
      leadSources,
      totalContacts
    });

  } catch (error) {
    console.error('💥 Fetch contacts error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}