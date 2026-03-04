import { NextRequest, NextResponse } from 'next/server';
import { runDailyIngest } from '@/lib/ingest/runDailyIngest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.CRON_SECRET) {
      console.error('[Cron] Unauthorized attempt to access ingest endpoint');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting daily ingest job');

    const stats = await runDailyIngest();

    return NextResponse.json({
      success: true,
      message: 'Daily ingest completed successfully',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Ingest job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
