import { NextRequest, NextResponse } from 'next/server';
import { campaignEngine } from '../../../../lib/campaign-engine';

export const dynamic = 'force-dynamic';

// POST /api/cron/campaigns - Trigger campaign processing (for Railway cron)
export async function POST(_request: NextRequest) {
  try {
    await campaignEngine.processCampaigns();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron run failed:', error);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}

// Optional GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}

