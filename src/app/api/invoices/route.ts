import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { saleId: { $regex: search, $options: 'i' } },
        { uuid: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (type) {
      query.referenceType = type;
    }
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        (query.issueDate as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (query.issueDate as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      ZatcaInvoice.find(query)
        .populate('createdBy', 'name email')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ZatcaInvoice.countDocuments(query),
    ]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await ZatcaInvoice.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          thisMonth: [
            { $match: { issueDate: { $gte: firstOfMonth } } },
            { $count: 'count' },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          byType: [
            { $group: { _id: '$referenceType', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const totalCount = stats[0]?.total[0]?.count || 0;
    const thisMonthCount = stats[0]?.thisMonth[0]?.count || 0;

    const statusCounts: Record<string, number> = {};
    (stats[0]?.byStatus || []).forEach((s: { _id: string; count: number }) => {
      statusCounts[s._id] = s.count;
    });

    const typeCounts: Record<string, number> = {};
    (stats[0]?.byType || []).forEach((t: { _id: string; count: number }) => {
      typeCounts[t._id] = t.count;
    });

    return NextResponse.json({
      invoices,
      pagination: { page, limit, pages: Math.ceil(total / limit), total },
      stats: {
        total: totalCount,
        thisMonth: thisMonthCount,
        byStatus: statusCounts,
        byType: typeCounts,
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
