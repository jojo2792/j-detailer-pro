export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface ServiceOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  basePriceCents: number;
  includes: string[];
  membershipCovered: boolean;
}

export interface VehicleRecord {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  plate: string | null;
  isDefault: boolean;
}

export interface SlotOption {
  /** ISO start time */
  startsAt: string;
  label: string;
  available: boolean;
}

export interface BookingRecord {
  id: string;
  reference: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  serviceName: string;
  vehicleSummary: string | null;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  notes: string | null;
  basePriceCents: number;
  discountPercentage: number;
  totalPriceCents: number;
}

export interface BookingQuote {
  basePriceCents: number;
  discountPercentage: number;
  totalPriceCents: number;
  planName: string | null;
  rewardMultiplier: number;
}

export interface NewBookingInput {
  serviceSlug: string;
  startsAt: string;
  vehicleId?: string;
  vehicle?: {
    vehicleType: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    plate?: string;
  };
  contactName: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  notes?: string;
}
