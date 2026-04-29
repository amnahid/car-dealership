import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Rental from '@/models/Rental';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && apiKey !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    
    // Find active rentals where endDate is in the past
    const overdueRentals = await Rental.find({
      status: 'Active',
      endDate: { $lt: now }
    });

    let updatedCount = 0;
    for (const rental of overdueRentals) {
      rental.status = 'Overdue';
      await rental.save();
      updatedCount++;
      
      console.log(`Rental ${rental.rentalId} marked as Overdue`);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updatedCount
    });
  } catch (error) {
    console.error('Rentals cron error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
