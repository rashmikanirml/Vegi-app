import type { OrderStatus, PaymentStatus } from '@/lib/types';

export function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `Rs ${amount.toFixed(2)}`;
}

export function kg(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${amount} kg`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function orderStatusLabel(status: OrderStatus) {
  return status.replace('_', ' ');
}

export function paymentStatusLabel(status: PaymentStatus) {
  return status.replace('_', ' ');
}

export function errorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
