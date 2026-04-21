import { sendExpirySms, SmsResult, isSmsServiceConfigured } from './sms';
import { sendExpiryAlertEmail, isEmailServiceConfigured } from './email';

export { isEmailServiceConfigured };

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface SaleInfo {
  saleId: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  finalPrice: number;
}

interface RentalInfo {
  rentalId: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  dailyRate: number;
}

function formatSaleThankYouMessage(customer: CustomerInfo, sale: SaleInfo): string {
  return `Thank you for your purchase, ${customer.name}! Your car ${sale.carBrand || ''} ${sale.carModel || sale.carId} has been sold to you for $${sale.finalPrice.toLocaleString()}. Your invoice is available. Welcome to AMYAL CAR!`;
}

function formatRentalConfirmationMessage(customer: CustomerInfo, rental: RentalInfo): string {
  const startDate = new Date(rental.startDate).toLocaleDateString();
  const endDate = new Date(rental.endDate).toLocaleDateString();
  return `Hi ${customer.name}, your rental ${rental.rentalId} for ${rental.carBrand || ''} ${rental.carModel || rental.carId} is confirmed from ${startDate} to ${endDate} at $${rental.dailyRate}/day. Total: $${rental.totalAmount.toLocaleString()}. Thank you for choosing AMYAL CAR!`;
}

function buildSaleThankYouEmailHtml(customer: CustomerInfo, sale: SaleInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #28aaa9 0%, #238f8e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Thank You for Your Purchase!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${customer.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for choosing AMYAL CAR! We are delighted to confirm your purchase.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Sale ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${sale.saleId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${sale.carBrand || ''} ${sale.carModel || sale.carId}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Amount Paid</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #059669; font-weight: 700;">$${sale.finalPrice.toLocaleString()}</td>
                </tr>
              </table>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Your invoice is available in your account. If you have any questions, please don't hesitate to contact us.
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

function buildRentalConfirmationEmailHtml(customer: CustomerInfo, rental: RentalInfo): string {
  const startDate = new Date(rental.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const endDate = new Date(rental.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rental Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #28aaa9 0%, #238f8e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Rental Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${customer.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Your car rental has been confirmed. We're excited to serve you!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Rental ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${rental.rentalId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${rental.carBrand || ''} ${rental.carModel || rental.carId}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Rental Period</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${startDate} - ${endDate} (${days} days)</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Daily Rate</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">$${rental.dailyRate}/day</td>
                </tr>
                <tr style="background-color: #f0fdf4;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Total Amount</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #059669; font-weight: 700;">$${rental.totalAmount.toLocaleString()}</td>
                </tr>
              </table>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Please arrive at our location at the scheduled time. If you need to make any changes, please contact us.
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

export interface NotificationResult {
  smsSent: boolean;
  smsError?: string;
  emailSent: boolean;
  emailError?: string;
}

async function sendCustomerSms(customer: CustomerInfo, message: string): Promise<{ success: boolean; error?: string }> {
  if (!customer.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  try {
    const result = await sendExpirySms(customer.phone, message);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendCustomerEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceConfigured()) {
    return { success: false, error: 'Email service not configured' };
  }

  if (!to) {
    return { success: false, error: 'No email address provided' };
  }

  const apiKey = process.env.MAILERLITE_API_KEY!;
  const fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'alerts@yourdomain.com';
  const fromName = process.env.MAILERLITE_FROM_NAME || 'Car Dealership System';

  try {
    const response = await fetch('https://api.mailerlite.com/api/v2/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: {
          from: fromEmail,
          from_name: fromName,
          to: to,
          subject: subject,
          html: html,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailerLite API error:', response.status, errorText);
      return { success: false, error: `MailerLite API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendSaleThankYouNotifications(
  customer: CustomerInfo,
  sale: SaleInfo
): Promise<NotificationResult> {
  const result: NotificationResult = { smsSent: false, emailSent: false };

  const message = formatSaleThankYouMessage(customer, sale);
  const smsResult = await sendCustomerSms(customer, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  if (customer.email) {
    const html = buildSaleThankYouEmailHtml(customer, sale);
    const emailResult = await sendCustomerEmail(
      customer.email,
      `Thank You for Your Purchase, ${customer.name}! - AMYAL CAR`,
      html
    );
    result.emailSent = emailResult.success;
    result.emailError = emailResult.error;
  }

  console.log(`Sale notifications for ${sale.saleId}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}

export async function sendRentalConfirmationNotifications(
  customer: CustomerInfo,
  rental: RentalInfo
): Promise<NotificationResult> {
  const result: NotificationResult = { smsSent: false, emailSent: false };

  const message = formatRentalConfirmationMessage(customer, rental);
  const smsResult = await sendCustomerSms(customer, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  if (customer.email) {
    const html = buildRentalConfirmationEmailHtml(customer, rental);
    const emailResult = await sendCustomerEmail(
      customer.email,
      `Rental Confirmed: ${rental.carBrand || ''} ${rental.carModel || rental.carId} - AMYAL CAR`,
      html
    );
    result.emailSent = emailResult.success;
    result.emailError = emailResult.error;
  }

  console.log(`Rental notifications for ${rental.rentalId}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}

interface InstallmentInfo {
  saleId: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  totalPrice: number;
  downPayment: number;
  monthlyPayment: number;
  tenureMonths: number;
  paymentSchedule: Array<{
    installmentNumber: number;
    dueDate: string;
    amount: number;
  }>;
}

interface PaymentReminderInfo {
  saleId: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
  lateFeePercent: number;
}

function formatInstallmentConfirmationMessage(customer: CustomerInfo, installment: InstallmentInfo): string {
  const schedule = installment.paymentSchedule
    .slice(0, 3)
    .map(p => `#${p.installmentNumber}: $${p.amount.toLocaleString()} due ${new Date(p.dueDate).toLocaleDateString()}`)
    .join(', ');
  const more = installment.paymentSchedule.length > 3 ? ` +${installment.paymentSchedule.length - 3} more` : '';
  return `Welcome, ${customer.name}! Your installment plan for ${installment.carBrand || ''} ${installment.carModel || installment.carId} is active. Monthly: $${installment.monthlyPayment.toLocaleString()}. Schedule: ${schedule}${more}. Thank you!`;
}

function formatPaymentReminderMessage(customer: CustomerInfo, reminder: PaymentReminderInfo): string {
  const dueDate = new Date(reminder.dueDate).toLocaleDateString();
  return `Reminder: Payment #${reminder.installmentNumber} of $${reminder.amount.toLocaleString()} is due on ${dueDate}${reminder.daysUntilDue ? ` (${reminder.daysUntilDue} days)` : ''}. Late fee: ${reminder.lateFeePercent}% after due date. - AMYAL CAR`;
}

function formatOverdueNoticeMessage(customer: CustomerInfo, reminder: PaymentReminderInfo): string {
  const dueDate = new Date(reminder.dueDate).toLocaleDateString();
  const lateFee = Math.round(reminder.amount * reminder.lateFeePercent / 100);
  const totalDue = reminder.amount + lateFee;
  return `URGENT: Payment #${reminder.installmentNumber} is ${reminder.daysOverdue} days overdue! Amount: $${reminder.amount.toLocaleString()} + late fee: $${lateFee.toLocaleString()} = $${totalDue.toLocaleString()}. Please pay immediately. - AMYAL CAR`;
}

function buildInstallmentConfirmationEmailHtml(customer: CustomerInfo, installment: InstallmentInfo): string {
  const scheduleRows = installment.paymentSchedule.map(p => `
    <tr style="background-color: ${p.installmentNumber % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
      <td style="padding: 10px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">#${p.installmentNumber}</td>
      <td style="padding: 10px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${new Date(p.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      <td style="padding: 10px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; text-align: right; font-weight: 600;">$${p.amount.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Installment Plan Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #28aaa9 0%, #238f8e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Installment Plan Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${customer.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for choosing our installment plan! Your vehicle has been reserved and your payment schedule is confirmed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;" colspan="2">${installment.carBrand || ''} ${installment.carModel || installment.carId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Total Price</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;" colspan="2">$${installment.totalPrice.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Down Payment</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #059669; font-weight: 600;" colspan="2">$${installment.downPayment.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Monthly Payment</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 700; font-size: 16px;" colspan="2">$${installment.monthlyPayment.toLocaleString()}</td>
                </tr>
              </table>
              <p style="color: #333333; font-size: 14px; font-weight: 600; margin: 20px 0 10px 0;">Payment Schedule (${installment.tenureMonths} months)</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px;">
                <tr style="background-color: #28aaa9;">
                  <th style="padding: 10px 15px; font-size: 12px; color: #ffffff; text-align: left;">No.</th>
                  <th style="padding: 10px 15px; font-size: 12px; color: #ffffff; text-align: left;">Due Date</th>
                  <th style="padding: 10px 15px; font-size: 12px; color: #ffffff; text-align: right;">Amount</th>
                </tr>
                ${scheduleRows}
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

function buildPaymentReminderEmailHtml(customer: CustomerInfo, reminder: PaymentReminderInfo): string {
  const dueDate = new Date(reminder.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lateFee = Math.round(reminder.amount * reminder.lateFeePercent / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Payment Reminder</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${customer.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                This is a friendly reminder that your next payment is due soon.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${reminder.carBrand || ''} ${reminder.carModel || reminder.carId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Payment No.</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333; font-weight: 600;">#${reminder.installmentNumber}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Amount Due</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 700; font-size: 18px;">$${reminder.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Due Date</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${dueDate}${reminder.daysUntilDue ? ` (${reminder.daysUntilDue} days)` : ''}</td>
                </tr>
                <tr style="background-color: #fff5f5;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Late Fee</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #ec4561;">${reminder.lateFeePercent}% ($${lateFee.toLocaleString()}) after due date</td>
                </tr>
              </table>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Please ensure your payment is made on time to avoid late fees.
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

function buildOverdueNoticeEmailHtml(customer: CustomerInfo, reminder: PaymentReminderInfo): string {
  const dueDate = new Date(reminder.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lateFee = Math.round(reminder.amount * reminder.lateFeePercent / 100);
  const totalDue = reminder.amount + lateFee;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent: Payment Overdue</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">URGENT: Payment Overdue</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${customer.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Your payment is overdue. Please make the payment immediately to avoid further penalties.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${reminder.carBrand || ''} ${reminder.carModel || reminder.carId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Payment No.</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #dc2626; font-weight: 700;">#${reminder.installmentNumber}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Days Overdue</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #dc2626; font-weight: 700;">${reminder.daysOverdue} days</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Original Amount</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">$${reminder.amount.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #fff5f5;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Late Fee (${reminder.lateFeePercent}%)</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #dc2626; font-weight: 600;">$${lateFee.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #fef2f2;">
                  <td style="padding: 12px 15px; font-size: 14px; color: #666666; font-weight: 700;">Total Due</td>
                  <td style="padding: 12px 15px; font-size: 14px; color: #dc2626; font-weight: 700; font-size: 18px;">$${totalDue.toLocaleString()}</td>
                </tr>
              </table>
              <p style="color: #dc2626; font-size: 14px; line-height: 1.6; margin: 20px 0; font-weight: 600;">
                Please contact us immediately to make your payment.
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

export async function sendInstallmentConfirmationNotifications(
  customer: CustomerInfo,
  installment: InstallmentInfo
): Promise<NotificationResult> {
  const result: NotificationResult = { smsSent: false, emailSent: false };

  const message = formatInstallmentConfirmationMessage(customer, installment);
  const smsResult = await sendCustomerSms(customer, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  if (customer.email) {
    const html = buildInstallmentConfirmationEmailHtml(customer, installment);
    const emailResult = await sendCustomerEmail(
      customer.email,
      `Installment Plan Confirmed - ${installment.carBrand || ''} ${installment.carModel || installment.carId} - AMYAL CAR`,
      html
    );
    result.emailSent = emailResult.success;
    result.emailError = emailResult.error;
  }

  console.log(`Installment confirmation for ${installment.saleId}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}

export async function sendPaymentReminderNotifications(
  customer: CustomerInfo,
  reminder: PaymentReminderInfo
): Promise<NotificationResult> {
  const result: NotificationResult = { smsSent: false, emailSent: false };

  const message = formatPaymentReminderMessage(customer, reminder);
  const smsResult = await sendCustomerSms(customer, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  if (customer.email) {
    const html = buildPaymentReminderEmailHtml(customer, reminder);
    const emailResult = await sendCustomerEmail(
      customer.email,
      `Payment Reminder: Installment #${reminder.installmentNumber} Due - AMYAL CAR`,
      html
    );
    result.emailSent = emailResult.success;
    result.emailError = emailResult.error;
  }

  console.log(`Payment reminder for ${reminder.saleId}#${reminder.installmentNumber}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}

export async function sendOverdueNoticeNotifications(
  customer: CustomerInfo,
  reminder: PaymentReminderInfo
): Promise<NotificationResult> {
  const result: NotificationResult = { smsSent: false, emailSent: false };

  const message = formatOverdueNoticeMessage(customer, reminder);
  const smsResult = await sendCustomerSms(customer, message);
  result.smsSent = smsResult.success;
  result.smsError = smsResult.error;

  if (customer.email) {
    const html = buildOverdueNoticeEmailHtml(customer, reminder);
    const emailResult = await sendCustomerEmail(
      customer.email,
      `URGENT: Payment #${reminder.installmentNumber} Overdue - AMYAL CAR`,
      html
    );
    result.emailSent = emailResult.success;
    result.emailError = emailResult.error;
  }

  console.log(`Overdue notice for ${reminder.saleId}#${reminder.installmentNumber}: SMS=${result.smsSent}, Email=${result.emailSent}`);
  return result;
}