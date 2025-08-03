import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 CSV export request received');

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

    // Get all contacts for this user
    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${contacts.length} contacts to export`);

    // Convert to CSV format
    const csvHeaders = [
      'Name',
      'Email', 
      'Company',
      'Position',
      'Phone',
      'LinkedIn',
      'Source',
      'Status',
      'Tags',
      'Notes',
      'Created Date'
    ];

    const csvRows = contacts.map(contact => [
      contact.name || '',
      contact.email || '',
      contact.company || '',
      contact.position || '',
      contact.phoneNumber || '',
      contact.linkedinUrl || '',
      contact.source || '',
      contact.status || '',
      Array.isArray(contact.tags) ? contact.tags.join('; ') : '',
      contact.notes || '',
      contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : ''
    ]);

    // Build CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    console.log('✅ CSV content generated');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('💥 CSV export error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 