import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' }, { status: 200 });
    }

    const hashedPassword = await hashPassword('Admin@123');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@dealership.com',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
