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
      case 'cars': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const status = searchParams.get('status');
        const brand = searchParams.get('brand');
        const model = searchParams.get('model');
        const year = searchParams.get('year');
        const color = searchParams.get('color');
        const plateNumber = searchParams.get('plateNumber');
        const q = searchParams.get('q') || searchParams.get('search');

        if (status) query.status = status;
        if (brand) query.brand = { $regex: brand, $options: 'i' };
        if (model) query.model = { $regex: model, $options: 'i' };
        if (year) query.year = parseInt(year);
        if (color) query.color = { $regex: color, $options: 'i' };
        if (plateNumber) query.plateNumber = { $regex: plateNumber, $options: 'i' };
        if (q) {
          query.$or = [
            { carId: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { model: { $regex: q, $options: 'i' } },
            { plateNumber: { $regex: q, $options: 'i' } },
            { chassisNumber: { $regex: q, $options: 'i' } },
            { sequenceNumber: { $regex: q, $options: 'i' } },
          ];
        }
        data = await Car.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'customers': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const q = searchParams.get('q') || searchParams.get('search');
        if (q) {
          query.$or = [
            { fullName: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { nationalId: { $regex: q, $options: 'i' } },
            { passportNumber: { $regex: q, $options: 'i' } },
          ];
        }
        data = await Customer.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'employees': {
        const query: Record<string, any> = { isActive: true };
        const q = searchParams.get('q') || searchParams.get('search');
        if (q) {
          query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ];
        }
        data = await Employee.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'suppliers': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const q = searchParams.get('q') || searchParams.get('search');
        if (q) {
          query.$or = [
            { companyName: { $regex: q, $options: 'i' } },
            { contactPerson: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ];
        }
        data = await Supplier.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'repairs': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const status = searchParams.get('status');
        const q = searchParams.get('q') || searchParams.get('search');
        if (status) query.status = status;
        if (q) {
          query.$or = [
            { repairId: { $regex: q, $options: 'i' } },
            { garageName: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
          ];
        }
        data = await Repair.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'cashSales': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer') || searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search') || searchParams.get('q');

        if (status) {
          query.status = status;
        } else if (!search) {
          query.status = { $ne: 'Cancelled' };
        }

        if (customerId) query.customer = customerId;
        if (startDate || endDate) {
          const dateQuery: any = {};
          if (startDate) dateQuery.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.$lte = end;
          }
          query.saleDate = dateQuery;
        }

        if (search) {
          const matchingCars = await Car.find({ plateNumber: { $regex: search, $options: 'i' } }).select('_id').lean();
          const matchingCarIds = matchingCars.map(c => c._id);
          query.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { carId: { $regex: search, $options: 'i' } },
            { saleId: { $regex: search, $options: 'i' } },
            { car: { $in: matchingCarIds } },
          ];
        }

        data = await CashSale.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'installmentSales': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer') || searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search') || searchParams.get('q');

        if (status) {
          query.status = status;
        } else if (!search) {
          query.status = { $ne: 'Cancelled' };
        }

        if (customerId) query.customer = customerId;
        if (startDate || endDate) {
          const dateQuery: any = {};
          if (startDate) dateQuery.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.$lte = end;
          }
          query.startDate = dateQuery;
        }

        if (search) {
          const matchingCars = await Car.find({ plateNumber: { $regex: search, $options: 'i' } }).select('_id').lean();
          const matchingCarIds = matchingCars.map(c => c._id);
          query.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { carId: { $regex: search, $options: 'i' } },
            { saleId: { $regex: search, $options: 'i' } },
            { car: { $in: matchingCarIds } },
          ];
        }

        data = await InstallmentSale.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'rentals': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer') || searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search') || searchParams.get('q');

        if (status) {
          query.status = status;
        } else if (!search) {
          query.status = { $ne: 'Cancelled' };
        }

        if (customerId) query.customer = customerId;
        if (startDate || endDate) {
          const dateQuery: any = {};
          if (startDate) dateQuery.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.$lte = end;
          }
          query.startDate = dateQuery;
        }

        if (search) {
          const matchingCars = await Car.find({ plateNumber: { $regex: search, $options: 'i' } }).select('_id').lean();
          const matchingCarIds = matchingCars.map(c => c._id);
          query.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { carId: { $regex: search, $options: 'i' } },
            { rentalId: { $regex: search, $options: 'i' } },
            { car: { $in: matchingCarIds } },
          ];
        }

        data = await Rental.find(query).sort({ createdAt: -1 }).lean();
        break;
      }
      case 'transactions': {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        const typeFilter = searchParams.get('typeFilter') || searchParams.get('transactionType');
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const q = searchParams.get('q') || searchParams.get('search');

        if (typeFilter && typeFilter !== 'all') query.type = typeFilter;
        if (category && category !== 'all') query.category = category;
        if (startDate || endDate) {
          const dateQuery: any = {};
          if (startDate) dateQuery.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.$lte = end;
          }
          query.date = dateQuery;
        }
        if (q) {
          query.$or = [
            { description: { $regex: q, $options: 'i' } },
            { reference: { $regex: q, $options: 'i' } },
          ];
        }

        data = await Transaction.find(query).sort({ date: -1 }).lean();
        break;
      }
      case 'salaryPayments': {
        const query: Record<string, any> = { status: { $ne: 'Cancelled' } };
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const employeeId = searchParams.get('employeeId');
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (employeeId) query.employee = employeeId;
        data = await SalaryPayment.find(query).sort({ paymentDate: -1 }).lean();
        break;
      }
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
