import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Accountant', 'Finance Manager'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const matchStage: Record<string, unknown> = {
      type: 'Expense',
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) (matchStage.date as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (matchStage.date as Record<string, Date>).$lte = new Date(endDate);
    }

    const [result] = await Transaction.aggregate([
      { $match: matchStage },
      {
        $facet: {
          records: [
            { $sort: { date: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          summary: [
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: { $ifNull: ['$category', 'Other'] }, total: { $sum: '$amount' } } }
          ],
          byMonth: [
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
            { $sort: { _id: 1 } }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ]);

    const expenses = result.records || [];
    const totalCount = result.totalCount[0]?.count || 0;
    const totalAmount = result.summary[0]?.total || 0;
    const count = result.summary[0]?.count || 0;

    const byCategory: Record<string, number> = {};
    (result.byCategory || []).forEach((item: { _id: string; total: number }) => {
      byCategory[item._id] = item.total;
    });

    const byMonth: Record<string, number> = {};
    (result.byMonth || []).forEach((item: { _id: string; total: number }) => {
      byMonth[item._id] = item.total;
    });

    return NextResponse.json({
      expenses,
      summary: { total: totalAmount, count, byCategory, byMonth },
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    console.error('Expenses API error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}
