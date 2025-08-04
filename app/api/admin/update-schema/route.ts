import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Add APOLLO to ContactSource enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'APOLLO' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'ContactSource'
          )
        ) THEN
          ALTER TYPE "ContactSource" ADD VALUE 'APOLLO';
        END IF;
      END $$;
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Schema updated successfully - APOLLO added to ContactSource enum' 
    });
  } catch (error: any) {
    console.error('Schema update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}