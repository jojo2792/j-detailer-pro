import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  bookingKeys,
  bookingService,
  myBookingsQuery,
  quoteQuery,
  servicesQuery,
  slotsQuery,
  vehiclesQuery,
} from "@/services/booking.service";
import type { BookingRecord, NewBookingInput } from "@/types/booking";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function useServices() {
  return useQuery(servicesQuery());
}

export function useMyVehicles(enabled: boolean) {
  return useQuery(vehiclesQuery(enabled));
}

export function useSlots(date: string) {
  return useQuery(slotsQuery(date));
}

export function useQuote(serviceSlug: string, enabled: boolean) {
  return useQuery(quoteQuery(serviceSlug, enabled));
}

export function useCreateBooking(onDone?: (booking: BookingRecord) => void) {
  const queryClient = useQueryClient();
  const create = useServerFn(bookingService.create);

  return useMutation({
    mutationFn: (input: NewBookingInput) => create({ data: input }),
    onSuccess: (booking) => {
      toast.success(`Appointment confirmed — reference ${booking.reference}.`);
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
      void queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.vehicles });
      onDone?.(booking);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useMyBookings(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery(myBookingsQuery(enabled));

  const cancelFn = useServerFn(bookingService.cancel);
  const rescheduleFn = useServerFn(bookingService.reschedule);

  const write = (list: BookingRecord[]) => {
    queryClient.setQueryData(bookingKeys.mine, list);
    void queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
  };

  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelFn({ data: { bookingId } }),
    onSuccess: (list) => {
      write(list);
      toast.success("Appointment cancelled.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const reschedule = useMutation({
    mutationFn: (input: { bookingId: string; startsAt: string }) => rescheduleFn({ data: input }),
    onSuccess: (list) => {
      write(list);
      toast.success("Appointment moved.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    cancel,
    reschedule,
  };
}
