import type { BookingStatus } from "@/types/booking";

export type StaffScope = "today" | "upcoming" | "mine";

export interface StaffAccess {
  isStaff: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
}

export interface StaffJob {
  id: string;
  reference: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  serviceName: string;
  serviceCategory: string;
  vehicleSummary: string | null;
  vehicleDetail: string | null;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  notes: string | null;
  technicianId: string | null;
  assignedToMe: boolean;
}

export interface StaffBoard {
  scope: StaffScope;
  jobs: StaffJob[];
  counts: { today: number; upcoming: number; mine: number };
  generatedAt: string;
}
