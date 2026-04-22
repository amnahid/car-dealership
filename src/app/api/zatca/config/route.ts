import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || user.role !== 'Admin') {
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
    if (!user || user.role !== 'Admin') {
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
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sellerName, sellerNameAr, trn, address, environment,
      complianceCsid, complianceCsidSecret,
      productionCsid, productionCsidSecret,
      privateKey, publicKey, certificate,
    } = body;

    const update: Record<string, unknown> = { updatedBy: user.userId };
    if (sellerName) update.sellerName = sellerName;
    if (sellerNameAr) update.sellerNameAr = sellerNameAr;
    if (trn) update.trn = trn;
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
