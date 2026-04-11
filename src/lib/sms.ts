import twilio from 'twilio';

export interface SmsResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface TwilioClient {
  messages: {
    create(params: {
      body: string;
      from: string;
      to: string;
    }): Promise<{ sid: string }>;
  };
}

let twilioClient: TwilioClient | null = null;
let fromPhoneNumber: string | null = null;

function isTwilioConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  return !!(accountSid && authToken && phoneNumber && accountSid !== 'your_twilio_account_sid');
}

function getTwilioClient(): TwilioClient | null {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken || accountSid === 'your_twilio_account_sid') {
    console.warn('Twilio credentials not configured. SMS alerts will be disabled.');
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER || null;

  return twilioClient;
}

function getAdminPhone(): string | null {
  const adminPhone = process.env.TWILIO_ADMIN_PHONE;
  if (adminPhone && adminPhone !== '+1234567890') {
    return adminPhone;
  }
  return null;
}

export function formatExpirySms(docInfo: {
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}): string {
  const urgency = docInfo.daysUntilExpiry <= 7 ? 'URGENT: ' : '';
  return `${urgency}DOC EXPIRING: ${docInfo.carId} ${docInfo.documentType} expires in ${docInfo.daysUntilExpiry} days. Renew ASAP. - NahidDealership`;
}

export async function sendExpirySms(to: string, message: string): Promise<SmsResult> {
  const client = getTwilioClient();

  if (!client || !fromPhoneNumber) {
    console.warn('SMS service not configured. Skipping SMS alert.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Ensure phone number is in E.164 format
    let formattedTo = to;
    if (!to.startsWith('+')) {
      formattedTo = '+' + to.replace(/\D/g, '');
    }

    const messageResult = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: formattedTo,
    });

    console.log(`Expiry alert SMS sent to ${formattedTo}, SID: ${messageResult.sid}`);
    return { success: true, messageId: messageResult.sid };
  } catch (error) {
    console.error('Error sending expiry alert SMS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendExpiryAlertSms(docInfo: {
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}): Promise<SmsResult> {
  const adminPhone = getAdminPhone();

  if (!adminPhone) {
    console.warn('Admin phone number not configured. Skipping SMS alert.');
    return { success: false, error: 'Admin phone not configured' };
  }

  const message = formatExpirySms(docInfo);
  return sendExpirySms(adminPhone, message);
}

export async function sendBatchExpiryAlertSms(docInfos: Array<{
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}>): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const docInfo of docInfos) {
    const result = await sendExpiryAlertSms(docInfo);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Failed to send SMS for ${docInfo.carId}:`, result.error);
    }
  }

  return { sent, failed };
}

export function isSmsServiceConfigured(): boolean {
  return isTwilioConfigured();
}