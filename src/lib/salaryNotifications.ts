import { sendExpirySms, isSmsServiceConfigured } from './sms';
import { sendExpiryAlertEmail, isEmailServiceConfigured, sendEmail } from './email';
import { logNotification } from './notificationLogger';

export { isEmailServiceConfigured };

interface SalaryPaymentInfo {
  paymentId: string;
  employeeId: string;
  amount: number;
  paymentDate: Date;
  month: number;
  year: number;
  paymentType: 'Monthly' | 'Bonus' | 'Advance' | 'Deduction';
  notes?: string;
}

interface EmployeeInfo {
  name: string;
  phone: string;
  email?: string;
}

function formatSalaryPaymentSms(employee: EmployeeInfo, payment: SalaryPaymentInfo): string {
  const monthName = new Date(payment.year, payment.month - 1).toLocaleString('en-US', { month: 'long' });
  const amount = payment.amount.toLocaleString();
  const typeLabel = payment.paymentType === 'Monthly' ? '' : ` (${payment.paymentType})`;
  return `Hi ${employee.name}, your salary${typeLabel} of $${amount} for ${monthName} ${payment.year} has been paid. Payment ID: ${payment.paymentId}. - AMYAL CAR`;
}

function formatSalaryPaymentEmail(employee: EmployeeInfo, payment: SalaryPaymentInfo): string {
  const monthName = new Date(payment.year, payment.month - 1).toLocaleString('en-US', { month: 'long' });
  const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const typeEmoji = payment.paymentType === 'Monthly' ? '' : payment.paymentType === 'Bonus' ? ' 🎉' : payment.paymentType === 'Advance' ? ' 💰' : ' ✂️';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Payment${typeEmoji}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Salary Payment Confirmed${typeEmoji}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${employee.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Your salary payment has been processed. Please find the details below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Payment ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${payment.paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Employee ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${payment.employeeId}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Payment Type</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${payment.paymentType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Period</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${monthName} ${payment.year}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Payment Date</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${paymentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Amount</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #059669; font-weight: 700; font-size: 18px;">$${payment.amount.toLocaleString()}</td>
                </tr>
                ${payment.notes ? `
                <tr style="background-color: #fef3c7;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Notes</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #92400e;">${payment.notes}</td>
                </tr>
                ` : ''}
              </table>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please contact the HR department.
              </p>
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

export interface SalaryNotificationResult {
  smsSent: boolean;
  smsError?: string;
  emailSent: boolean;
  emailError?: string;
}

async function sendEmployeeSms(employee: EmployeeInfo, message: string): Promise<{ success: boolean; error?: string }> {
  if (!employee.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  if (!isSmsServiceConfigured()) {
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const result = await sendExpirySms(employee.phone, message);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendEmployeeEmail(employee: EmployeeInfo, html: string): Promise<{ success: boolean; error?: string }> {
  if (!employee.email) {
    return { success: false, error: 'No email address provided' };
  }

  if (!isEmailServiceConfigured()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await sendEmail({
      to: employee.email,
      subject: 'Salary Payment Received - AMYAL CAR',
      html: html,
    });
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendSalaryPaymentNotifications(
  employee: EmployeeInfo,
  payment: SalaryPaymentInfo
): Promise<SalaryNotificationResult> {
  const result: SalaryNotificationResult = { smsSent: false, emailSent: false };

  const message = formatSalaryPaymentSms(employee, payment);
  const smsResult = await sendEmployeeSms(employee, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  await logNotification({
    channel: 'sms',
    type: 'salary_payment',
    recipientName: employee.name,
    recipientPhone: employee.phone,
    subject: 'Salary Payment Received',
    content: message,
    referenceId: payment.paymentId,
    referenceType: 'SalaryPayment',
    status: smsResult.success ? 'sent' : 'failed',
    errorMessage: smsResult.error,
    metadata: { amount: payment.amount, month: payment.month, year: payment.year, paymentType: payment.paymentType },
  });

  const html = formatSalaryPaymentEmail(employee, payment);
  const emailResult = await sendEmployeeEmail(employee, html);
  result.emailSent = emailResult.success;
  result.emailError = emailResult.error;

  if (employee.email) {
    await logNotification({
      channel: 'email',
      type: 'salary_payment',
      recipientName: employee.name,
      recipientEmail: employee.email,
      subject: 'Salary Payment Received - AMYAL CAR',
      content: html,
      referenceId: payment.paymentId,
      referenceType: 'SalaryPayment',
      status: emailResult.success ? 'sent' : 'failed',
      errorMessage: emailResult.error,
      metadata: { amount: payment.amount, month: payment.month, year: payment.year, paymentType: payment.paymentType },
    });
  }

  console.log(`Salary payment notifications for ${payment.paymentId}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}