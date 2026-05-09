import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { csvToJson } from '@/lib/csv';
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
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    const text = await file.text();
    const records = csvToJson(text);

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found in CSV' }, { status: 400 });
    }

    let result;
    const commonFields = { createdBy: user.userId };

    switch (type) {
      case 'cars':
        // For cars, we might need to handle carId generation if missing
        result = await Car.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'customers':
        result = await Customer.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'employees':
        result = await Employee.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'suppliers':
        result = await Supplier.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'repairs':
        result = await Repair.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'cashSales':
        result = await CashSale.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'installmentSales':
        result = await InstallmentSale.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'rentals':
        result = await Rental.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'transactions':
        result = await Transaction.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      case 'salaryPayments':
        result = await SalaryPayment.insertMany(records.map(r => ({ ...r, ...commonFields })));
        break;
      default:
        return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Imported ${records.length} ${type} via CSV`,
      module: 'Administration',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: `Successfully imported ${records.length} ${type}`,
      count: records.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
