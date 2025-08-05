import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/waitlist - Waitlist signup endpoint for Framer integration
 * 
 * Accepts JSON payload: { name?, email }
 * Saves signup to PostgreSQL database on Railway
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Waitlist signup request received');
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));

    // Parse request body - handle both JSON and form data
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let name: string | undefined;
    let email: string | undefined;

    if (contentType.includes('application/json')) {
      body = await request.json();
      console.log('🔍 JSON body received:', body);
      ({ name, email } = body);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.text();
      console.log('🔍 Form data received:', formData);
      const urlParams = new URLSearchParams(formData);
      name = urlParams.get('name') || undefined;
      email = urlParams.get('email') || undefined;
      body = { name, email };
    } else {
      // Try JSON as fallback
      try {
        body = await request.json();
        console.log('🔍 Fallback JSON body received:', body);
        ({ name, email } = body);
      } catch (e) {
        console.log('❌ Unable to parse request body');
        return NextResponse.json(
          { error: 'Invalid request format' }, 
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!email) {
      console.log('❌ Missing email in waitlist signup');
      return NextResponse.json(
        { error: 'Email is required' }, 
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      );
    }

    console.log('💾 Saving waitlist signup:', { name: name || 'Anonymous', email });

    // Save to database
    const waitlistEntry = await prisma.waitlistSignup.create({
      data: {
        name: name || null,
        email: email.toLowerCase().trim(),
        source: 'framer'
      }
    });

    console.log('✅ Waitlist signup saved:', waitlistEntry.id);

    // Return success response
    return NextResponse.json({ 
      success: true,
      id: waitlistEntry.id,
      message: 'Successfully added to waitlist'
    });

  } catch (error: any) {
    console.error('💥 Waitlist signup error:', error);

    // Handle duplicate email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      console.log('⚠️ Duplicate email signup attempt');
      return NextResponse.json(
        { error: 'Email already registered for waitlist' }, 
        { status: 409 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist - Get waitlist statistics (optional)
 * 
 * Returns basic stats about waitlist signups
 */
export async function GET() {
  try {
    console.log('📊 Waitlist stats request received');

    // Get basic statistics
    const totalSignups = await prisma.waitlistSignup.count();
    const recentSignups = await prisma.waitlistSignup.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    console.log('✅ Waitlist stats retrieved');

    return NextResponse.json({
      success: true,
      stats: {
        totalSignups,
        recentSignups,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Waitlist stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}