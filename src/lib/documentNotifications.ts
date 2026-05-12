import { sendExpiryWhatsApp, isWhatsAppServiceConfigured } from './whatsapp';
import { sendExpiryAlertEmail, isEmailServiceConfigured, sendEmail } from './email';
import { logNotification } from './notificationLogger';

export { isEmailServiceConfigured };

interface DocumentRenewalInfo {
  documentId: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  documentType: string;
  oldExpiryDate: Date;
  newExpiryDate: Date;
  renewedDate: Date;
}

interface AdminInfo {
  name?: string;
  phone?: string;
  email?: string;
}

function formatDocumentRenewalWhatsApp(admin: AdminInfo, doc: DocumentRenewalInfo): string {
  const oldDate = new Date(doc.oldExpiryDate).toLocaleDateString();
  const newDate = new Date(doc.newExpiryDate).toLocaleDateString();
  return `*Document renewed*\n\n🚗 Vehicle: ${doc.carBrand || ''} ${doc.carModel || doc.carId}\n📄 Doc: ${doc.documentType}\n📅 Old: ${oldDate}\n📅 New: ${newDate}\n\n- AMYAL CAR`;
}

function formatDocumentRenewalEmail(admin: AdminInfo, doc: DocumentRenewalInfo): string {
  const oldDate = new Date(doc.oldExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const newDate = new Date(doc.newExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const renewedDate = new Date(doc.renewedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Renewed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Document Renewed</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${admin.name || 'Admin'},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                The following vehicle document has been renewed successfully.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Document ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${doc.documentId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${doc.carBrand || ''} ${doc.carModel || doc.carId}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Document Type</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${doc.documentType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Old Expiry</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #dc2626;">${oldDate}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">New Expiry</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #059669; font-weight: 600;">${newDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Renewed Date</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #333333;">${renewedDate}</td>
                </tr>
              </table>
              <p style="color: #888888; font-size: 12px; margin: 30px 0 0 0; text-align: center;">
                © ${new Date().getFullYear()} AMYAL CAR. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface RenewalNotificationResult {
  whatsappSent: boolean;
  whatsappError?: string;
  emailSent: boolean;
  emailError?: string;
}

const defaultAdmin = {
  name: 'Admin',
  email: process.env.RESEND_ADMIN_EMAIL || 'admin@dealership.com',
  phone: process.env.META_WA_ADMIN_PHONE,
};

async function sendAdminWhatsApp(message: string): Promise<{ success: boolean; error?: string }> {
  const adminPhone = defaultAdmin.phone;
  if (!adminPhone) {
    return { success: false, error: 'Admin WhatsApp phone not configured' };
  }

  if (!(await isWhatsAppServiceConfigured())) {
    return { success: false, error: 'WhatsApp service not configured' };
  }

  try {
    const result = await sendExpiryWhatsApp(adminPhone, message);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendAdminEmail(html: string): Promise<{ success: boolean; error?: string }> {
  const adminEmail = defaultAdmin.email;
  if (!adminEmail) {
    return { success: false, error: 'Admin email not configured' };
  }

  if (!isEmailServiceConfigured()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await sendEmail({
      to: adminEmail,
      subject: 'Document Renewed - AMYAL CAR',
      html: html,
    });
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendDocumentRenewalNotifications(
  doc: DocumentRenewalInfo,
  admin: AdminInfo = defaultAdmin
): Promise<RenewalNotificationResult> {
  const result: RenewalNotificationResult = { whatsappSent: false, emailSent: false };

  const message = formatDocumentRenewalWhatsApp(admin, doc);
  const whatsappResult = await sendAdminWhatsApp(message);
  result.whatsappSent = whatsappResult.success;
  result.whatsappError = whatsappResult.error;

  await logNotification({
    channel: 'whatsapp',
    type: 'document_renewed',
    recipientName: admin.name || 'Admin',
    recipientPhone: admin.phone,
    subject: 'Document Renewed',
    content: message,
    referenceId: doc.documentId,
    referenceType: 'Document',
    status: whatsappResult.success ? 'sent' : 'failed',
    errorMessage: whatsappResult.error,
  });

  const html = formatDocumentRenewalEmail(admin, doc);
  const emailResult = await sendAdminEmail(html);
  result.emailSent = emailResult.success;
  result.emailError = emailResult.error;

  await logNotification({
    channel: 'email',
    type: 'document_renewed',
    recipientName: admin.name || 'Admin',
    recipientEmail: admin.email,
    subject: 'Document Renewed - AMYAL CAR',
    content: html,
    referenceId: doc.documentId,
    referenceType: 'Document',
    status: emailResult.success ? 'sent' : 'failed',
    errorMessage: emailResult.error,
  });

  console.log(`Document renewal notifications for ${doc.documentId}: WhatsApp=${result.whatsappSent}, Email=${result.emailSent}`);
  return result;
}