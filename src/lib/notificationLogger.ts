import { connectDB } from '@/lib/db';
import NotificationLog from '@/models/NotificationLog';

export interface LogNotificationParams {
  channel: 'whatsapp' | 'email';
  type: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject: string;
  content: string;
  referenceId?: string;
  referenceType?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export async function logNotification(params: LogNotificationParams): Promise<void> {
  await connectDB();

  await NotificationLog.create({
    channel: params.channel,
    type: params.type,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    recipientEmail: params.recipientEmail,
    subject: params.subject,
    content: params.content,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
    status: params.status,
    errorMessage: params.errorMessage,
    sentAt: params.status === 'sent' ? new Date() : undefined,
    metadata: params.metadata,
  });
}

export async function getNotificationLogs(filters: {
  channel?: string;
  type?: string;
  status?: string;
  referenceType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const {
    channel,
    type,
    status,
    referenceType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  if (channel) query.channel = channel;
  if (type) query.type = type;
  if (status) query.status = status;
  if (referenceType) query.referenceType = referenceType;
  if (startDate || endDate) {
    query.sentAt = {};
    if (startDate) (query.sentAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.sentAt as Record<string, Date>).$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NotificationLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}