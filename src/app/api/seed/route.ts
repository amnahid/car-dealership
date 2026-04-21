import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      await User.deleteMany({ role: 'Admin' });
    }

    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: { id: existingAdmin._id, name: existingAdmin.name, email: existingAdmin.email, role: existingAdmin.role },
        hint: 'Use ?force=true to delete and recreate',
      }, { status: 200 });
    }

    const hashedPassword = await hashPassword('Admin@123');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@amyalcar.com',
      password: hashedPassword,
      role: 'Admin',
      isActive: true,
    });

    return NextResponse.json(
      {
        message: 'Admin user created successfully',
        user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Seed error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
