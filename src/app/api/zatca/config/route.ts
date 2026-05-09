import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await ZatcaConfig.findOne({ isActive: true })
      .select('-privateKey -complianceCsidSecret -productionCsidSecret')
      .lean();

    return NextResponse.json({ config });
  } catch (error) {
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
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sellerName, sellerNameAr, trn,
      address, environment,
    } = body;

    if (!sellerName || !sellerNameAr || !trn || !address) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    if (trn.length !== 15) {
      return NextResponse.json({ error: 'TRN must be exactly 15 digits' }, { status: 400 });
    }

    // Deactivate existing configs
    await ZatcaConfig.updateMany({}, { $set: { isActive: false } });

    const config = await ZatcaConfig.create({
      sellerName,
      sellerNameAr,
      trn,
      address,
      environment: environment || 'sandbox',
      isActive: true,
      updatedBy: user.userId,
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

const body = await request.json();
  const {
    sellerName, sellerNameAr, trn, address, environment,
    complianceCsid, complianceCsidSecret,
    productionCsid, productionCsidSecret,
    privateKey, publicKey, certificate,
  } = body;

  const trimmedTrn = trn?.trim() ?? '';

  if (trn && trimmedTrn.length !== 15) {
    return NextResponse.json(
      { error: 'TRN must be exactly 15 digits', received: `${trimmedTrn.length} chars` },
      { status: 400 }
    );
  }

  if (trimmedTrn && !/^\d{15}$/.test(trimmedTrn)) {
    return NextResponse.json(
      { error: 'TRN must contain only digits (15 digits required)' },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { updatedBy: user.userId };
  if (sellerName) update.sellerName = sellerName.trim();
  if (sellerNameAr) update.sellerNameAr = sellerNameAr.trim();
  if (trimmedTrn) update.trn = trimmedTrn;
  if (address) update.address = address;
  if (environment) update.environment = environment;
  if (complianceCsid) update.complianceCsid = complianceCsid;
  if (complianceCsidSecret) update.complianceCsidSecret = complianceCsidSecret;
  if (productionCsid) update.productionCsid = productionCsid;
  if (productionCsidSecret) update.productionCsidSecret = productionCsidSecret;
  if (privateKey) update.privateKey = privateKey;
  if (publicKey) update.publicKey = publicKey;
  if (certificate) update.certificate = certificate;

    const config = await ZatcaConfig.findOneAndUpdate(
      { isActive: true },
      { $set: update },
      { new: true }
    ).select('-privateKey -complianceCsidSecret -productionCsidSecret');

    if (!config) {
      return NextResponse.json({ error: 'No active ZATCA config found' }, { status: 404 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error) {
      console.error('ZATCA config PUT error:', error.message);
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        return NextResponse.json({ error: `Validation error: ${error.message}` }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
