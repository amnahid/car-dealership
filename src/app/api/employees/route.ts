import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Employee from '@/models/Employee';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const activeOnly = searchParams.get('active') === 'true';

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query.department = department;
    }

    if (activeOnly) {
      query.isActive = true;
    }

    const skip = (page - 1) * limit;
    const [employees, total] = await Promise.all([
      Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Employee.countDocuments(query),
    ]);

    // Get total salary expense
    const salaryStats = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$baseSalary' } } },
    ]);

    return NextResponse.json({
      employees,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalMonthlySalary: salaryStats[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, designation, department, baseSalary, joiningDate } = body;

    if (!name || !phone || !designation || !department || !baseSalary || !joiningDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const employee = await Employee.create({
      name, phone, email, designation, department, baseSalary, joiningDate,
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created employee: ${name}`,
      module: 'HR',
      targetId: employee._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}