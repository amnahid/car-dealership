import { connectDB } from '@/lib/db';
import VehicleDocument from '@/models/Document';
import { sendExpiryAlertEmail, sendBatchExpiryAlertEmails, isEmailServiceConfigured, DocumentAlertInfo } from '@/lib/email';
import { sendExpiryAlertSms, sendBatchExpiryAlertSms, isSmsServiceConfigured } from '@/lib/sms';

export interface AlertResult {
  emailsSent: number;
  emailsFailed: number;
  smsSent: number;
  smsFailed: number;
  totalDocuments: number;
  errors: string[];
}

interface DocumentWithCar {
  _id: string;
  car: { carId: string; brand: string; model: string };
  carId: string;
  documentType: string;
  expiryDate: Date;
  alertSent30: boolean;
  alertSent15: boolean;
  alertSent7: boolean;
}

async function getExpiringDocuments(): Promise<DocumentWithCar[]> {
  await connectDB();
  const now = new Date();

  // Get all documents that haven't expired yet
  const documents = await VehicleDocument.find({
    expiryDate: { $gte: now },
  })
    .populate('car', 'carId brand model')
    .sort({ expiryDate: 1 })
    .lean();

  return documents as unknown as DocumentWithCar[];
}

function calculateDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((expiryDate.getTime() - now.getTime()) / msPerDay);
}

function shouldSend30DayAlert(doc: DocumentWithCar, daysUntilExpiry: number): boolean {
  return daysUntilExpiry <= 30 && daysUntilExpiry > 15 && !doc.alertSent30;
}

function shouldSend15DayAlert(doc: DocumentWithCar, daysUntilExpiry: number): boolean {
  return daysUntilExpiry <= 15 && daysUntilExpiry > 7 && !doc.alertSent15;
}

function shouldSend7DayAlert(doc: DocumentWithCar, daysUntilExpiry: number): boolean {
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !doc.alertSent7;
}

async function updateAlertFlags(docId: string, daysUntilExpiry: number): Promise<void> {
  const updateFields: Record<string, boolean> = {};

  if (daysUntilExpiry <= 30 && daysUntilExpiry > 15) {
    updateFields.alertSent30 = true;
  }
  if (daysUntilExpiry <= 15 && daysUntilExpiry > 7) {
    updateFields.alertSent15 = true;
  }
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    updateFields.alertSent7 = true;
  }

  if (Object.keys(updateFields).length > 0) {
    await VehicleDocument.findByIdAndUpdate(docId, updateFields);
  }
}

export async function checkAndSendExpiryAlerts(): Promise<AlertResult> {
  const result: AlertResult = {
    emailsSent: 0,
    emailsFailed: 0,
    smsSent: 0,
    smsFailed: 0,
    totalDocuments: 0,
    errors: [],
  };

  console.log('Starting expiry alert check...');

  // Check if services are configured
  const emailConfigured = isEmailServiceConfigured();
  const smsConfigured = isSmsServiceConfigured();

  if (!emailConfigured && !smsConfigured) {
    const error = 'Neither email nor SMS service is configured. Please configure MailerLite and/or Twilio.';
    console.warn(error);
    result.errors.push(error);
    return result;
  }

  try {
    const documents = await getExpiringDocuments();
    result.totalDocuments = documents.length;
    console.log(`Found ${documents.length} documents to check`);

    // Group documents by which alerts need to be sent
    const docsNeeding30DayAlert: DocumentAlertInfo[] = [];
    const docsNeeding15DayAlert: DocumentAlertInfo[] = [];
    const docsNeeding7DayAlert: DocumentAlertInfo[] = [];

    for (const doc of documents) {
      const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiryDate);
      const carInfo = doc.car || { carId: doc.carId, brand: '', model: '' };

      const docInfo: DocumentAlertInfo = {
        carId: carInfo.carId || doc.carId,
        brand: carInfo.brand || '',
        model: carInfo.model || '',
        documentType: doc.documentType,
        expiryDate: doc.expiryDate,
        daysUntilExpiry,
      };

      // Check which alerts need to be sent
      if (shouldSend30DayAlert(doc, daysUntilExpiry)) {
        docsNeeding30DayAlert.push(docInfo);
      }
      if (shouldSend15DayAlert(doc, daysUntilExpiry)) {
        docsNeeding15DayAlert.push(docInfo);
      }
      if (shouldSend7DayAlert(doc, daysUntilExpiry)) {
        docsNeeding7DayAlert.push(docInfo);
      }
    }

    console.log(`Alerts needed: 30-day: ${docsNeeding30DayAlert.length}, 15-day: ${docsNeeding15DayAlert.length}, 7-day: ${docsNeeding7DayAlert.length}`);

    // Combine all documents needing alerts
    const allDocsNeedingAlert = [...docsNeeding30DayAlert, ...docsNeeding15DayAlert, ...docsNeeding7DayAlert];

    // Send email alerts if configured
    if (emailConfigured && allDocsNeedingAlert.length > 0) {
      const emailResult = await sendBatchExpiryAlertEmails(allDocsNeedingAlert);
      result.emailsSent = emailResult.sent;
      result.emailsFailed = emailResult.failed;
      console.log(`Email alerts: ${emailResult.sent} sent, ${emailResult.failed} failed`);
    }

    // Send SMS alerts if configured
    if (smsConfigured && allDocsNeedingAlert.length > 0) {
      const smsResult = await sendBatchExpiryAlertSms(allDocsNeedingAlert);
      result.smsSent = smsResult.sent;
      result.smsFailed = smsResult.failed;
      console.log(`SMS alerts: ${smsResult.sent} sent, ${smsResult.failed} failed`);
    }

    // Update alert flags in database
    for (const doc of documents) {
      const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiryDate);
      await updateAlertFlags(doc._id.toString(), daysUntilExpiry);
    }

    console.log('Expiry alert check completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in checkAndSendExpiryAlerts:', errorMessage);
    result.errors.push(errorMessage);
  }

  return result;
}

// Export for manual testing/triggering
export async function triggerExpiryAlerts() {
  console.log('Manually triggering expiry alerts...');
  const result = await checkAndSendExpiryAlerts();
  console.log('Alert results:', result);
  return result;
}