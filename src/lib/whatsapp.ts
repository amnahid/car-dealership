import WhatsAppConfig from '@/models/WhatsAppConfig';
import { connectDB } from './db';

export interface WhatsAppResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface WhatsAppConfigData {
  accessToken: string;
  phoneNumberId: string;
  adminPhone: string;
}

async function getWhatsAppConfig(): Promise<WhatsAppConfigData | null> {
  try {
    await connectDB();
    const dbConfig = await WhatsAppConfig.findOne({ isActive: true }).lean();
    
    if (dbConfig) {
      return {
        accessToken: dbConfig.accessToken,
        phoneNumberId: dbConfig.phoneNumberId,
        adminPhone: dbConfig.adminPhone,
      };
    }
  } catch (error) {
    console.error('Error fetching WhatsApp config from DB:', error);
  }

  // Fallback to environment variables
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const adminPhone = process.env.META_WA_ADMIN_PHONE;

  if (accessToken && phoneNumberId) {
    return {
      accessToken,
      phoneNumberId,
      adminPhone: adminPhone || '',
    };
  }

  return null;
}

export async function isWhatsAppServiceConfigured(): Promise<boolean> {
  const config = await getWhatsAppConfig();
  return !!config;
}

/**
 * Formats a phone number for Meta WhatsApp Cloud API (E.164 without '+' prefix)
 */
function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<WhatsAppResult> {
  const config = await getWhatsAppConfig();

  if (!config) {
    console.warn('WhatsApp service not configured. Skipping message.');
    return { success: false, error: 'WhatsApp service not configured' };
  }

  const { accessToken, phoneNumberId } = config;
  const formattedTo = formatPhoneNumber(to);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Meta API Error:', data);
      return { 
        success: false, 
        error: data.error?.message || `HTTP error! status: ${response.status}` 
      };
    }

    console.log(`WhatsApp message sent to ${formattedTo}, ID: ${data.messages?.[0]?.id}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function formatExpiryWhatsApp(docInfo: {
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}): string {
  const urgency = docInfo.daysUntilExpiry <= 7 ? '⚠️ URGENT: ' : '';
  return `${urgency}*DOCUMENT EXPIRING*\n\n🚗 Car: ${docInfo.carId}\n📄 Doc: ${docInfo.documentType}\n⏰ Expires in: ${docInfo.daysUntilExpiry} days.\n\nPlease renew as soon as possible.\n\n- AMYAL CAR`;
}

export async function sendExpiryWhatsApp(to: string, message: string): Promise<WhatsAppResult> {
  return sendWhatsAppMessage(to, message);
}

export async function sendExpiryAlertWhatsApp(docInfo: {
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}): Promise<WhatsAppResult> {
  const config = await getWhatsAppConfig();

  if (!config || !config.adminPhone) {
    console.warn('Admin WhatsApp phone number not configured. Skipping alert.');
    return { success: false, error: 'Admin phone not configured' };
  }

  const message = formatExpiryWhatsApp(docInfo);
  return sendWhatsAppMessage(config.adminPhone, message);
}

export async function sendBatchExpiryAlertWhatsApp(docInfos: Array<{
  carId: string;
  documentType: string;
  daysUntilExpiry: number;
}>): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const docInfo of docInfos) {
    const result = await sendExpiryAlertWhatsApp(docInfo);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Failed to send WhatsApp for ${docInfo.carId}:`, result.error);
    }
  }

  return { sent, failed };
}