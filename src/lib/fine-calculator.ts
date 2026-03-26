/**
 * Fine calculation utilities (stored in paise)
 */

const OVERDUE_DAILY_FINE = 1000; // ₹10 per day
const DAMAGED_FINE = 5000; // ₹50 per damaged component
const LOST_FINE = 20000; // ₹200 flat for lost

export function calculateOverdueFine(daysOverdue: number): number {
  return daysOverdue * OVERDUE_DAILY_FINE;
}

export function calculateDamagedFine(): number {
  return DAMAGED_FINE;
}

export function calculateLostFine(): number {
  return LOST_FINE;
}

export function formatPaiseToRupees(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
  return `₹${rupees}`;
}

export function formatFineAmount(amount: number, reason: string): string {
  if (reason === 'OVERDUE') {
    return `${formatPaiseToRupees(amount)} (₹10/day)`;
  }
  if (reason === 'DAMAGED') {
    return `${formatPaiseToRupees(amount)} (₹50/item)`;
  }
  if (reason === 'LOST') {
    return `${formatPaiseToRupees(amount)} (replacement)`;
  }
  return formatPaiseToRupees(amount);
}
