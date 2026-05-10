import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Car, { ICarRaw } from '@/models/Car';
import Repair from '@/models/Repair';
import Rental from '@/models/Rental';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import { getAuthPayload } from '@/lib/apiAuth';
import { generateCarProfitLossReport, type CarPLData } from '@/lib/reportGenerator';

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

    if (!user.normalizedRoles.some(r => ['Admin', 'Finance Manager', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const car = await Car.findById(id).populate('purchase').lean();
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    const [repairs, rentals, cashSale, installmentSale] = await Promise.all([
      Repair.find({ car: id }).sort({ repairDate: 1 }).lean(),
      Rental.find({ car: id, status: { $ne: 'Cancelled' } }).sort({ startDate: 1 }).lean(),
      CashSale.findOne({ car: id, status: { $ne: 'Cancelled' } }).lean(),
      InstallmentSale.findOne({ car: id, status: { $ne: 'Cancelled' } }).lean(),
    ]);

    const expenses: CarPLData['expenses'] = [];
    const revenues: CarPLData['revenues'] = [];

    // Add Purchase Cost
    if (car.purchase) {
      expenses.push({
        date: (car.purchase as any).purchaseDate?.toISOString() || car.createdAt.toISOString(),
        description: 'Initial Vehicle Purchase',
        amount: (car.purchase as any).purchasePrice || 0,
        type: 'Purchase',
      });
    }

    // Add Repairs
    repairs.forEach(repair => {
      expenses.push({
        date: new Date(repair.repairDate).toISOString(),
        description: `Repair: ${repair.repairDescription}`,
        amount: repair.totalCost || 0,
        type: 'Repair',
      });
    });

    // Add Rentals
    rentals.forEach(rental => {
      revenues.push({
        date: new Date(rental.startDate).toISOString(),
        description: `Rental Income: ${rental.customerName} (${rental.rentalId})`,
        amount: rental.totalAmountWithVat || rental.totalAmount || 0,
        type: 'Rental',
      });
    });

    // Add Sales
    if (cashSale) {
      revenues.push({
        date: new Date(cashSale.saleDate).toISOString(),
        description: `Cash Sale: ${cashSale.customerName} (${cashSale.saleId})`,
        amount: cashSale.finalPriceWithVat || cashSale.finalPrice || 0,
        type: 'Sale',
      });
    }

    if (installmentSale) {
      revenues.push({
        date: new Date(installmentSale.startDate).toISOString(),
        description: `Installment Sale: ${installmentSale.customerName} (${installmentSale.saleId})`,
        amount: installmentSale.finalPriceWithVat || installmentSale.totalPrice || 0,
        type: 'Sale',
      });
    }

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

    const reportUrl = await generateCarProfitLossReport({
      carDetails: {
        carId: car.carId,
        brand: car.brand,
        model: car.model,
        year: car.year,
        plateNumber: (car as unknown as ICarRaw).plateNumber,
        chassisNumber: (car as unknown as ICarRaw).chassisNumber,
      },
      expenses,
      revenues,
      summary: {
        totalExpense,
        totalRevenue,
        netProfit: totalRevenue - totalExpense,
      }
    });

    return NextResponse.json({ reportUrl });
  } catch (error) {
    console.error('Car P&L report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
