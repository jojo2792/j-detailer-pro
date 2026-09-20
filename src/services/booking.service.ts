import { queryOptions } from "@tanstack/react-query";
import {
  cancelMyBooking,
  createMyBooking,
  listMyBookings,
  listMyVehicles,
  listServices,
  listSlots,
  quoteService,
  rescheduleMyBooking,
} from "@/lib/booking.functions";

export const bookingKeys = {
  services: ["booking", "services"] as const,
  vehicles: ["booking", "vehicles"] as const,
  slots: (date: string) => ["booking", "slots", date] as const,
  quote: (slug: string) => ["booking", "quote", slug] as const,
  mine: ["booking", "mine"] as const,
};

export const servicesQuery = () =>
  queryOptions({
    queryKey: bookingKeys.services,
    queryFn: () => listServices(),
    staleTime: 5 * 60 * 1000,
  });

export const vehiclesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: bookingKeys.vehicles,
    queryFn: () => listMyVehicles(),
    enabled,
  });

export const slotsQuery = (date: string) =>
  queryOptions({
    queryKey: bookingKeys.slots(date),
    queryFn: () => listSlots({ data: { date } }),
    enabled: Boolean(date),
  });

export const quoteQuery = (serviceSlug: string, enabled: boolean) =>
  queryOptions({
    queryKey: bookingKeys.quote(serviceSlug),
    queryFn: () => quoteService({ data: { serviceSlug } }),
    enabled: enabled && Boolean(serviceSlug),
  });

export const myBookingsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: bookingKeys.mine,
    queryFn: () => listMyBookings(),
    enabled,
  });

export const bookingService = {
  create: createMyBooking,
  cancel: cancelMyBooking,
  reschedule: rescheduleMyBooking,
};
