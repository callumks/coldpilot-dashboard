import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { validateDomain, extractDomainFromEmail, type DomainStatus } from '../../../../lib/domain-validator';

export const dynamic = 'force-dynamic';

interface UploadResponse {
  success: boolean;
  summary: {
    totalRows: number;
    created: number;
    skippedExisting: number;
    rejected: number;
    validationErrors: number;
  };
  details: {
    createdContacts: { name: string; email: string }[];
    skippedEmails: string[];
    rejectedDomains: { email: string; reason: string }[];
    validationErrors: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 CSV upload request received');

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      );
    }

    console.log('📄 File received:', file.name, 'Size:', file.size, 'bytes');

    // Read file content
    const csvText = await file.text();
    console.log('📖 CSV content length:', csvText.length, 'characters');

    // Simple CSV parsing (split by lines and commas)
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    console.log('📊 Headers found:', headers);
    console.log('📝 Data rows:', dataRows.length);

    // Find column indices
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => 
          h.toLowerCase().includes(name.toLowerCase())
        );
        if (index !== -1) return index;
      }
      return -1;
    };

    const emailIndex = getColumnIndex(['email', 'email_address', 'mail']);
    const firstNameIndex = getColumnIndex(['first_name', 'firstname', 'first name']);
    const lastNameIndex = getColumnIndex(['last_name', 'lastname', 'last name']);
    const nameIndex = getColumnIndex(['name', 'full_name', 'fullname']);
    const companyIndex = getColumnIndex(['company', 'company_name', 'organization']);
    const positionIndex = getColumnIndex(['position', 'title', 'job_title', 'role']);

    if (emailIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must contain an email column (email, email_address, or mail)' },
        { status: 400 }
      );
    }

    console.log('🔍 Column mapping - Email:', emailIndex, 'Name:', nameIndex, 'FirstName:', firstNameIndex);

    // Process rows
    const processedContacts = [];
    const validationErrors = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2; // +2 for header row and 0-based index
      const cells = dataRows[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      const email = cells[emailIndex]?.trim().toLowerCase();
      
      if (!email) {
        validationErrors.push(`Row ${rowNumber}: Email is required`);
        continue;
      }

      if (!isValidEmail(email)) {
        validationErrors.push(`Row ${rowNumber}: Invalid email format: ${email}`);
        continue;
      }

      // Build name
      let name = '';
      if (nameIndex !== -1 && cells[nameIndex]) {
        name = cells[nameIndex].trim();
      } else if (firstNameIndex !== -1 || lastNameIndex !== -1) {
        const firstName = firstNameIndex !== -1 ? cells[firstNameIndex]?.trim() || '' : '';
        const lastName = lastNameIndex !== -1 ? cells[lastNameIndex]?.trim() || '' : '';
        name = [firstName, lastName].filter(n => n).join(' ');
      }
      
      if (!name) {
        name = email.split('@')[0]; // Fallback to email username
      }

      const contact = {
        name,
        email,
        company: companyIndex !== -1 ? cells[companyIndex]?.trim() || undefined : undefined,
        position: positionIndex !== -1 ? cells[positionIndex]?.trim() || undefined : undefined,
        source: 'MANUAL' as const,
        status: 'COLD' as const,
      };

      processedContacts.push(contact);
    }

    console.log('✅ Processed contacts:', processedContacts.length);
    console.log('⚠️ Validation errors:', validationErrors.length);

    if (processedContacts.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid contacts found',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueContacts = processedContacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.email === contact.email)
    );

    // Check for existing contacts in database
    const existingEmails = await prisma.contact.findMany({
      where: {
        userId: user.id,
        email: {
          in: uniqueContacts.map(c => c.email)
        }
      },
      select: { email: true }
    });

    const existingEmailSet = new Set(existingEmails.map(c => c.email));
    const newContacts = uniqueContacts.filter(c => !existingEmailSet.has(c.email));
    const skippedExisting = uniqueContacts.filter(c => existingEmailSet.has(c.email));

    console.log('🆕 New contacts to validate:', newContacts.length);
    console.log('⏭️ Existing contacts skipped:', skippedExisting.length);

    // ✅ PREMIUM FEATURE: Domain validation for CSV uploads
    const validatedContacts = [];
    const rejectedContacts = [];
    let createdCount = 0;

    console.log('🔍 Starting domain validation for CSV contacts...');

    for (const contact of newContacts) {
      try {
        const domain = extractDomainFromEmail(contact.email);
        if (!domain) {
          rejectedContacts.push({ email: contact.email, reason: 'Invalid email format' });
          continue;
        }

        console.log(`🔍 Validating domain: ${domain} for ${contact.email}`);
        const domainStatus = await validateDomain(domain);
        
        if (domainStatus !== 'active') {
          console.log(`🚫 Rejecting CSV contact due to domain status: ${domainStatus} - ${contact.email}`);
          
          // Save to rejected leads table for analytics  
          await prisma.$queryRaw`INSERT INTO rejected_leads (id, "userId", name, email, company, position, source, "domainStatus") VALUES (${Math.random().toString(36).substring(2)}, ${user.id}, ${contact.name}, ${contact.email}, ${contact.company}, ${contact.position}, 'MANUAL', ${domainStatus})`;
          
          rejectedContacts.push({ 
            email: contact.email, 
            reason: `Domain ${domainStatus === 'parked' ? 'is parked' : 'does not resolve'}` 
          });
          continue;
        }

        // Domain is valid, add to validated contacts
        validatedContacts.push({
          ...contact,
          userId: user.id,
          tags: [],
          domainStatus: 'active',
          lastDomainValidated: new Date()
        });

      } catch (error) {
        console.error(`❌ Error validating ${contact.email}:`, error);
        rejectedContacts.push({ email: contact.email, reason: 'Validation error' });
      }
    }

    // Create validated contacts in database
    if (validatedContacts.length > 0) {
      const createResult = await prisma.contact.createMany({
        data: validatedContacts,
        skipDuplicates: true,
      });

      createdCount = createResult.count;
      console.log('✅ Validated contacts created in database:', createdCount);
    }

    console.log('📊 CSV processing summary:', {
      total: dataRows.length,
      created: createdCount,
      existing: skippedExisting.length,
      rejected: rejectedContacts.length,
      validationErrors: validationErrors.length
    });

    // Prepare response
    const response: UploadResponse = {
      success: true,
      summary: {
        totalRows: dataRows.length,
        created: createdCount,
        skippedExisting: skippedExisting.length,
        rejected: rejectedContacts.length,
        validationErrors: validationErrors.length,
      },
      details: {
        createdContacts: validatedContacts.map(c => ({ name: c.name, email: c.email })),
        skippedEmails: skippedExisting.map(c => c.email),
        rejectedDomains: rejectedContacts,
        validationErrors: validationErrors,
      }
    };

    console.log('🎉 CSV upload completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 CSV upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 