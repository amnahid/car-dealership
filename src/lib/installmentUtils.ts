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
