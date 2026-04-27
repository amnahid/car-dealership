import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VehicleDocument from '@/models/Document';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Car Manager', 'Sales Person'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const documents = await VehicleDocument.find({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    })
      .sort({ expiryDate: 1 })
      .populate('car', 'carId brand model')
      .lean();

    const documentsWithDays = documents.map((doc) => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntilExpiry = Math.ceil(((doc.expiryDate as Date).getTime() - now.getTime()) / msPerDay);
      return { ...doc, daysUntilExpiry };
    });

    return NextResponse.json({ documents: documentsWithDays });
  } catch (error) {
    console.error('Get expiring documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
