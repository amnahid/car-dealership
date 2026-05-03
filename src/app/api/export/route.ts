import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { jsonToCsv } from '@/lib/csv';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Employee from '@/models/Employee';
import Supplier from '@/models/Supplier';
import Repair from '@/models/Repair';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import Transaction from '@/models/Transaction';
import SalaryPayment from '@/models/SalaryPayment';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    let data: any[] = [];
    const fileName = `export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'cars':
        data = await Car.find({ isDeleted: { $ne: true } }).lean();
        break;
      case 'customers':
        data = await Customer.find({ isDeleted: { $ne: true } }).lean();
        break;
      case 'employees':
        data = await Employee.find({ isActive: true }).lean();
        break;
      case 'suppliers':
        data = await Supplier.find({ isDeleted: { $ne: true } }).lean();
        break;
      case 'repairs':
        data = await Repair.find({ isDeleted: { $ne: true } }).lean();
        break;
      case 'cashSales':
        data = await CashSale.find({ status: { $ne: 'Cancelled' } }).lean();
        break;
      case 'installmentSales':
        data = await InstallmentSale.find({ status: { $ne: 'Cancelled' } }).lean();
        break;
      case 'rentals':
        data = await Rental.find({ status: { $ne: 'Cancelled' } }).lean();
        break;
      case 'transactions':
        data = await Transaction.find({ isDeleted: { $ne: true } }).lean();
        break;
      case 'salaryPayments':
        data = await SalaryPayment.find({ status: { $ne: 'Cancelled' } }).lean();
        break;
      case 'users':
        data = await User.find({}).select('-password -resetToken -resetTokenExpiry').lean();
        break;
      case 'activityLogs':
        data = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(1000).lean();
        break;
      default:
        return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
    }

    const csv = jsonToCsv(data);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
