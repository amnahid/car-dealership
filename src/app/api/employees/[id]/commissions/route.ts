import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Employee from '@/models/Employee';
import CashSale from '@/models/CashSale';
import { getAuthPayload } from '@/lib/apiAuth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Accountant', 'Finance Manager'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const employee = await Employee.findById(id).lean();
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const sales = await CashSale.find({
      agentName: employee.name,
      agentCommission: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .select('saleId agentCommission createdAt carId finalPrice')
      .lean();

    const totalCommission = sales.reduce((sum, s) => sum + (s.agentCommission || 0), 0);

    return NextResponse.json({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      commissionRate: employee.commissionRate ?? null,
      totalCommission,
      salesCount: sales.length,
      sales,
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
