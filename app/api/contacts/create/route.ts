import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

interface CreateContactRequest {
  name: string;
  email: string;
  company?: string;
  position?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  notes?: string;
  source: 'MANUAL';
  status: 'COLD';
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Create contact request received');

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

    // Parse request body
    const contactData: CreateContactRequest = await request.json();

    // Validate required fields
    if (!contactData.name || !contactData.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('✅ Contact data validated');

    // Check if contact with this email already exists for this user
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: user.id,
        email: contactData.email.toLowerCase(),
      }
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }

    // Create the contact
    const newContact = await prisma.contact.create({
      data: {
        name: contactData.name,
        email: contactData.email.toLowerCase(),
        company: contactData.company || undefined,
        position: contactData.position || undefined,
        phoneNumber: contactData.phoneNumber || undefined,
        linkedinUrl: contactData.linkedinUrl || undefined,
        notes: contactData.notes || undefined,
        source: contactData.source,
        status: contactData.status,
        userId: user.id,
        tags: [],
      }
    });

    console.log('✅ Contact created:', newContact.id);

    return NextResponse.json({
      success: true,
      contact: {
        id: newContact.id,
        name: newContact.name,
        email: newContact.email,
        company: newContact.company,
        position: newContact.position,
        phoneNumber: newContact.phoneNumber,
        linkedinUrl: newContact.linkedinUrl,
        notes: newContact.notes,
        source: newContact.source,
        status: newContact.status,
        createdAt: newContact.createdAt,
      }
    });

  } catch (error) {
    console.error('💥 Create contact error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 