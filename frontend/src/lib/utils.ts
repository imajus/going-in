import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EventStats } from '@/lib/graphql';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if refund is available for an event
 * Refund deadline is 12 hours before event timestamp
 */
export function canRefund(eventTimestamp: bigint): boolean {
  const refundDeadline = eventTimestamp - BigInt(12 * 60 * 60);
  return BigInt(Math.floor(Date.now() / 1000)) < refundDeadline;
}

/**
 * Get refund deadline timestamp for an event (12 hours before event)
 */
export function getRefundDeadline(eventTimestamp: bigint): bigint {
  return eventTimestamp - BigInt(12 * 60 * 60);
}

/**
 * Compute available revenue for withdrawal from GraphQL EventStats
 * Available revenue = Net revenue - Revenue withdrawn
 */
export function computeAvailableRevenue(stats: EventStats | null): bigint {
  if (!stats) return BigInt(0);
  return BigInt(stats.netRevenue) - BigInt(stats.revenueWithdrawn);
}
