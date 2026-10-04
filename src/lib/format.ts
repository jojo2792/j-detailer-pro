export function formatTTD(cents: number): string {
  return `TT$${(cents / 100).toLocaleString("en-TT", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-TT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Port_of_Spain",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-TT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    // Appointments are booked in Trinidad time; show them that way on every device and on the server.
    timeZone: "America/Port_of_Spain",
  });
}