import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Employee from '@/models/Employee';
import SalaryPayment from '@/models/SalaryPayment';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import '@/models/Car'; // Ensure Car model is registered for population
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
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

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
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

    const [payments, cashSales, installmentSales, rentals] = await Promise.all([
      SalaryPayment.find({ employee: id, isDeleted: false }).sort({ paymentDate: -1 }).lean(),
      CashSale.find({ agentName: (employee as any).name, isDeleted: false, status: { $ne: 'Cancelled' } })
        .populate('car', 'brand model')
        .sort({ saleDate: -1 })
        .lean(),
      InstallmentSale.find({ agentName: (employee as any).name, isDeleted: false, status: { $ne: 'Cancelled' } })
        .populate('car', 'brand model')
        .sort({ startDate: -1 })
        .lean(),
      Rental.find({ agentName: (employee as any).name, isDeleted: false, status: { $ne: 'Cancelled' } })
        .populate('car', 'brand model')
        .sort({ startDate: -1 })
        .lean(),
    ]);

    // Map and combine sales
    const sales = [
      ...cashSales.map(s => ({
        ...s,
        saleDate: (s as any).saleDate,
        type: 'Cash'
      })),
      ...installmentSales.map(s => ({
        ...s,
        finalPrice: (s as any).totalPrice,
        saleDate: (s as any).startDate,
        type: 'Installment'
      }))
    ].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    return NextResponse.json({
      employee,
      payments,
      sales,
      rentals
    });
  } catch (error) {
    console.error('Get employee error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, email, passportNumber, designation, department, baseSalary, commissionRate, joiningDate, isActive, photo, passportDocument, passportExpiryDate } = body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, phone, email, passportNumber, designation, department, baseSalary, commissionRate, joiningDate, isActive, photo, passportDocument, passportExpiryDate },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Updated employee: ${name}`,
      module: 'HR',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Update employee error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Deleted employee: ${employee.name}`,
      module: 'HR',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
