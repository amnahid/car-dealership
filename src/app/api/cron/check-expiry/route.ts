import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendExpiryAlerts } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Verify API key for security
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = process.env.CRON_API_KEY;

    if (!expectedKey) {
      console.error('CRON_API_KEY not configured');
      return NextResponse.json(
        { error: 'Cron job not configured properly' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the expiry check
    const result = await checkAndSendExpiryAlerts();

    return NextResponse.json({
      success: true,
      message: 'Expiry alert check completed',
      ...result,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow manual trigger via GET for testing (in development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const result = await checkAndSendExpiryAlerts();
      return NextResponse.json({
        success: true,
        message: 'Manual expiry alert check (dev mode)',
        ...result,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed. Use POST with X-API-Key header.' },
    { status: 405 }
  );
}