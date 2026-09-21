/**
 * Calculates the accrued late fee for an installment based on the overdue days.
 * 
 * Logic:
 * - 10-day grace period (0 SAR)
 * - After 10 days, a fixed monthly fee is charged for each 30-day period.
 *   - 11-40 days: 1 * monthlyLateFee
 *   - 41-70 days: 2 * monthlyLateFee
 *   - etc.
 * 
 * @param daysOverdue Number of days since the due date
 * @param monthlyLateFee The fixed monthly late fee amount (default 200)
 * @returns The calculated accrued late fee
 */
export function calculateAccruedLateFee(daysOverdue: number, monthlyLateFee: number = 200): number {
  if (daysOverdue <= 10) {
    return 0;
  }
  
  // monthsOverdue = floor((daysOverdue - 11) / 30) + 1
  const monthsOverdue = Math.floor((daysOverdue - 11) / 30) + 1;
  return monthsOverdue * monthlyLateFee;
}

export interface RecalculatedInstallmentState {
  totalPaid: number;
  lateFeeCharged: number;
  remainingAmount: number;
  nextPaymentDate: Date | null;
  nextPaymentAmount: number;
  saleStatus: 'Active' | 'Completed' | 'Defaulted';
  carStatus: 'On Installment' | 'Sold' | 'Defaulted';
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: Date | string;
  amount: number;
  status: string;
  paidAmount?: number;
  lateFee?: number;
  paidDate?: Date | string;
  method?: string;
  voucherNumber?: string;
  notes?: string;
}

/**
 * Pure calculation function that recalculates totalPaid, lateFeeCharged, remainingAmount,
 * nextPaymentDate, nextPaymentAmount, saleStatus, and carStatus strictly from the current
 * paymentSchedule without relying on previous counters.
 */
export function recalculateInstallmentTotals(
  loanAmount: number,
  paymentSchedule: InstallmentScheduleItem[],
  now: Date = new Date()
): RecalculatedInstallmentState {
  let totalPaid = 0;
  let lateFeeCharged = 0;
  let hasOverdue = false;
  let nextUnpaid: InstallmentScheduleItem | null = null;
  let allPaid = true;

  for (const p of paymentSchedule) {
    if (p.status === 'Paid') {
      const fee = Number(p.lateFee) || 0;
      const paid = Number(p.paidAmount) !== undefined && !isNaN(Number(p.paidAmount))
        ? Number(p.paidAmount)
        : (Number(p.amount) + fee);
      totalPaid += paid;
      lateFeeCharged += fee;
    } else {
      allPaid = false;
      if (!nextUnpaid) {
        nextUnpaid = p;
      }
      const dueDate = new Date(p.dueDate);
      if (p.status === 'Overdue' || dueDate < now) {
        hasOverdue = true;
      }
    }
  }

  const principalPaid = Math.max(0, totalPaid - lateFeeCharged);
  const remainingAmount = Math.max(0, loanAmount - principalPaid);

  let saleStatus: 'Active' | 'Completed' | 'Defaulted' = 'Active';
  let carStatus: 'On Installment' | 'Sold' | 'Defaulted' = 'On Installment';
  let nextPaymentDate: Date | null = null;
  let nextPaymentAmount = 0;

  if (allPaid || remainingAmount === 0) {
    saleStatus = 'Completed';
    carStatus = 'Sold';
  } else if (hasOverdue) {
    saleStatus = 'Defaulted';
    carStatus = 'Defaulted';
    if (nextUnpaid) {
      nextPaymentDate = new Date(nextUnpaid.dueDate);
      nextPaymentAmount = nextUnpaid.amount;
    }
  } else {
    saleStatus = 'Active';
    carStatus = 'On Installment';
    if (nextUnpaid) {
      nextPaymentDate = new Date(nextUnpaid.dueDate);
      nextPaymentAmount = nextUnpaid.amount;
    }
  }

  return {
    totalPaid,
    lateFeeCharged,
    remainingAmount,
    nextPaymentDate,
    nextPaymentAmount,
    saleStatus,
    carStatus,
  };
}

