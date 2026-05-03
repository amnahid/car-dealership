import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VehicleDocument from '@/models/Document';
import User from '@/models/User';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const documentType = searchParams.get('documentType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (carId) query.car = carId;
    if (documentType) query.documentType = documentType;

    const [total, documents] = await Promise.all([
      VehicleDocument.countDocuments(query),
      VehicleDocument.find(query)
        .sort({ expiryDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('car', 'carId brand model')
        .populate('createdBy', 'name')
        .lean(),
    ]);

    return NextResponse.json({
      documents,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();

    if (body.documents && Array.isArray(body.documents)) {
      console.log('Creating bulk documents:', body.documents);
      const docs = await VehicleDocument.insertMany(
        body.documents.map((doc: Record<string, unknown>) => ({
          ...doc,
          createdBy: auth.userId,
        }))
      );

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Created ${docs.length} documents for car ${body.documents[0]?.carId}`,
        module: 'Documents',
        targetId: docs[0]?._id?.toString() || '',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ documents: docs }, { status: 201 });
    }

    const document = await VehicleDocument.create({ ...body, createdBy: auth.userId });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created document for car ${body.carId}`,
      module: 'Documents',
      targetId: document._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
