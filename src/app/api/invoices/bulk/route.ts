import { NextRequest, NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceIds, action } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'No invoices selected' }, { status: 400 });
    }

    if (action === 'download') {
      const downloadUrls = invoiceIds.map((id: string) => ({
        id,
        url: `/invoices/invoice-${id}.pdf`,
      }));
      return NextResponse.json({ success: true, downloadUrls });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk invoices error:', error);
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 });
  }
}