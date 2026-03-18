import { connectDB } from './db';
import ActivityLog from '@/models/ActivityLog';

interface LogActivityParams {
  userId: string;
  userName: string;
  action: string;
  module: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create({
      user: params.userId,
      userName: params.userName,
      action: params.action,
      module: params.module,
      targetId: params.targetId || '',
      details: params.details || '',
      ipAddress: params.ipAddress || '',
    });
  } catch (error) {
    // Log errors should not break the main flow
    console.error('Failed to log activity:', error);
  }
}
