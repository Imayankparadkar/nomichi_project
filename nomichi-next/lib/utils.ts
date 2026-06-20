import type { LeadStatus } from "./types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusBadgeClass(status: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    NEW: "badge-new",
    CONTACTED: "badge-contacted",
    QUALIFIED: "badge-qualified",
    VIBE_CHECK_SENT: "badge-vibe",
    CONFIRMED: "badge-confirmed",
    NOT_A_FIT: "badge-not-fit",
  };
  return map[status] ?? "badge-new";
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ""));
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
