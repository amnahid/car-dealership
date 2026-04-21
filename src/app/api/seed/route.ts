import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Accounts Officer' | 'Sales Agent';
}

const DEFAULT_USERS: SeedUser[] = [
  { name: 'System Admin', email: 'admin@amyalcar.com', password: 'Admin@123', role: 'Admin' },
  { name: 'Manager User', email: 'manager@amyalcar.com', password: 'Manager@123', role: 'Manager' },
  { name: 'Accounts Officer', email: 'accounts@amyalcar.com', password: 'Accounts@123', role: 'Accounts Officer' },
  { name: 'Sales Agent', email: 'agent@amyalcar.com', password: 'Agent@123', role: 'Sales Agent' },
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      await User.deleteMany({});
    }

    const created: SeedUser[] = [];
    const existing: SeedUser[] = [];

    for (const userData of DEFAULT_USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        existing.push({ name: existingUser.name, email: existingUser.email, password: '', role: existingUser.role as SeedUser['role'] });
      } else {
        const hashedPassword = await hashPassword(userData.password);
        const newUser = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
        });
        created.push({ ...userData, password: '' });
        console.log(`Created user: ${newUser.email} (${newUser.role})`);
      }
    }

    const status = created.length > 0 ? 201 : 200;
    const message = created.length > 0
      ? `${created.length} user(s) created successfully`
      : 'All users already exist';

    return NextResponse.json({
      message,
      created: created.map(u => ({ name: u.name, email: u.email, role: u.role })),
      existing: existing.map(u => ({ name: u.name, email: u.email, role: u.role })),
      defaultCredentials: {
        admin: { email: 'admin@amyalcar.com', password: 'Admin@123' },
        manager: { email: 'manager@amyalcar.com', password: 'Manager@123' },
        accounts: { email: 'accounts@amyalcar.com', password: 'Accounts@123' },
        agent: { email: 'agent@amyalcar.com', password: 'Agent@123' },
      },
      hint: 'Use ?force=true to delete all and recreate',
    }, { status });
  } catch (error) {
    console.error('Seed error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
