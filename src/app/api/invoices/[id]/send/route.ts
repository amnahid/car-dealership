import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import Customer from '@/models/Customer';
import path from 'path';
import fs from 'fs';
import { logActivity } from '@/lib/activityLogger';

interface ResendResponse {
  data?: { id: string };
  error?: { message: string };
}

async function sendEmailWithAttachment(
  to: string,
  subject: string,
  html: string,
  attachmentPath: string,
  filename: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const fileBuffer = fs.readFileSync(attachmentPath);
    const base64Content = fileBuffer.toString('base64');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Car Dealership <noreply@dealership.com>',
        to: [to],
        subject,
        html,
        attachments: [
          {
            filename,
            content: base64Content,
          },
        ],
      }),
    });

    const data: ResendResponse = await res.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.data?.id };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email, saleId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const invoice = await ZatcaInvoice.findById(id).lean();
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceFilename = `invoice-${invoice.saleId}.pdf`;
    const invoicePath = path.join(process.cwd(), 'public', 'uploads', 'invoices', invoiceFilename);

    if (!fs.existsSync(invoicePath)) {
      return NextResponse.json({ error: 'Invoice PDF not found. Please regenerate.' }, { status: 404 });
    }

    const subject = `Your Invoice #${invoice.saleId} from Car Dealership`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28aaa9; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CAR DEALERSHIP</h1>
          <p style="margin: 5px 0 0;">مركز بيع وتأجير السيارات</p>
        </div>
        <div style="padding: 20px; background: #f9fbfd;">
          <h2 style="color: #333;">Thank you for your business!</h2>
          <p style="color: #666; line-height: 1.6;">
            Please find attached your invoice <strong>#${invoice.saleId}</strong> for your recent purchase.
          </p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Invoice ID:</strong> ${invoice.saleId}</p>
            <p style="margin: 5px 0 0;"><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0 0;"><strong>Type:</strong> ${invoice.referenceType}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
        <div style="padding: 15px; background: #333; color: #999; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Car Dealership & Rental Management System</p>
        </div>
      </div>
    `;

    const result = await sendEmailWithAttachment(email, subject, html, invoicePath, invoiceFilename);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: 'Sent invoice via email',
      module: 'Invoice',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
