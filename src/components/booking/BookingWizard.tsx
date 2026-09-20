import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateBooking, useMyVehicles, useQuote, useServices, useSlots } from "@/hooks/use-booking";
import { formatDateTime, formatTTD } from "@/lib/format";
import type { BookingRecord } from "@/types/booking";

const VEHICLE_TYPES = ["car", "suv", "truck", "van", "motorcycle", "boat"];

function todayInTT() {
  const now = new Date(Date.now() - 4 * 3600 * 1000);
  return now.toISOString().slice(0, 10);
}

const label = "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground";
const field =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
const cardBase = "rounded-2xl border border-border bg-card p-6";

export function BookingWizard() {
  const { user, isLoading: authLoading } = useAuth();
  const services = useServices();
  const vehicles = useMyVehicles(Boolean(user));

  const [serviceSlug, setServiceSlug] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "car",
    make: "",
    model: "",
    year: "",
    color: "",
    plate: "",
  });
  const [date, setDate] = useState(todayInTT());
  const [startsAt, setStartsAt] = useState("");
  const [contact, setContact] = useState({
    contactName: (user?.user_metadata?.["full_name"] as string | undefined) ?? "",
    contactPhone: (user?.user_metadata?.["phone"] as string | undefined) ?? "",
    addressLine: "",
    city: "",
    notes: "",
  });
  const [confirmed, setConfirmed] = useState<BookingRecord | null>(null);

  const slots = useSlots(date);
  const quote = useQuote(serviceSlug, Boolean(user) && Boolean(serviceSlug));
  const create = useCreateBooking((booking) => {
    setConfirmed(booking);
    setStartsAt("");
  });

  const service = useMemo(
    () => services.data?.find((s) => s.slug === serviceSlug) ?? null,
    [services.data, serviceSlug],
  );

  const usingSavedVehicle = vehicleId !== "";
  const vehicleReady = usingSavedVehicle || (newVehicle.make.trim() !== "" && newVehicle.model.trim() !== "");
  const canSubmit =
    Boolean(user) &&
    Boolean(service) &&
    Boolean(startsAt) &&
    vehicleReady &&
    contact.contactName.trim().length >= 2 &&
    contact.contactPhone.trim().length >= 7 &&
    contact.addressLine.trim().length >= 5 &&
    contact.city.trim().length >= 2 &&
    !create.isPending;

  function submit() {
    if (!service || !canSubmit) return;
    create.mutate({
      serviceSlug: service.slug,
      startsAt,
      ...(usingSavedVehicle
        ? { vehicleId }
        : {
            vehicle: {
              vehicleType: newVehicle.vehicleType,
              make: newVehicle.make.trim(),
              model: newVehicle.model.trim(),
              ...(newVehicle.year ? { year: Number(newVehicle.year) } : {}),
              ...(newVehicle.color.trim() ? { color: newVehicle.color.trim() } : {}),
              ...(newVehicle.plate.trim() ? { plate: newVehicle.plate.trim() } : {}),
            },
          }),
      contactName: contact.contactName.trim(),
      contactPhone: contact.contactPhone.trim(),
      addressLine: contact.addressLine.trim(),
      city: contact.city.trim(),
      ...(contact.notes.trim() ? { notes: contact.notes.trim() } : {}),
    });
  }

  if (confirmed) {
    return (
      <div className={`${cardBase} text-center`} role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-bold">You're booked.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed.serviceName} · {formatDateTime(confirmed.scheduledAt)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference <span className="font-semibold text-foreground">{confirmed.reference}</span> ·{" "}
          {formatTTD(confirmed.totalPriceCents)}
          {confirmed.discountPercentage > 0 ? ` (member ${confirmed.discountPercentage}% off)` : ""}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-7 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
          >
            View my appointments
          </Link>
          <button
            type="button"
            onClick={() => setConfirmed(null)}
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Service */}
      <section className={cardBase} aria-labelledby="step-service">
        <h2 id="step-service" className="font-display text-lg font-semibold">
          1. Choose your service
        </h2>
        {services.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading services…</p>
        ) : services.isError ? (
          <p className="mt-4 text-sm text-destructive">
            Services didn't load. Please refresh and try again.
          </p>
        ) : services.data?.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.data.map((s) => {
              const active = s.slug === serviceSlug;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setServiceSlug(s.slug)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-base font-semibold">{s.name}</span>
                    <span className="text-sm text-primary">{formatTTD(s.basePriceCents)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.durationMinutes} min{s.description ? ` · ${s.description}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No services are listed right now.</p>
        )}
        {quote.data ? (
          <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            {quote.data.planName
              ? `${quote.data.planName} member price: `
              : "Your price: "}
            <span className="font-semibold text-foreground">{formatTTD(quote.data.totalPriceCents)}</span>
            {quote.data.discountPercentage > 0
              ? ` (${quote.data.discountPercentage}% member discount applied)`
              : ""}
          </p>
        ) : null}
      </section>

      {/* 2. Vehicle */}
      <section className={cardBase} aria-labelledby="step-vehicle">
        <h2 id="step-vehicle" className="font-display text-lg font-semibold">
          2. Your vehicle
        </h2>
        {vehicles.data?.length ? (
          <div className="mt-4">
            <label className={label} htmlFor="saved-vehicle">
              Saved vehicles
            </label>
            <select
              id="saved-vehicle"
              className={field}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Add a different vehicle</option>
              {vehicles.data.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!usingSavedVehicle ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="v-type">
                Type
              </label>
              <select
                id="v-type"
                className={field}
                value={newVehicle.vehicleType}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0]?.toUpperCase()}
                    {t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="v-year">
                Year
              </label>
              <input
                id="v-year"
                className={field}
                inputMode="numeric"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                placeholder="2021"
              />
            </div>
            <div>
              <label className={label} htmlFor="v-make">
                Make
              </label>
              <input
                id="v-make"
                className={field}
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                placeholder="Toyota"
              />
            </div>
            <div>
              <label className={label} htmlFor="v-model">
                Model
              </label>
              <input
                id="v-model"
                className={field}
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                placeholder="Corolla"
              />
            </div>
            <div>
              <label className={label} htmlFor="v-color">
                Colour
              </label>
              <input
                id="v-color"
                className={field}
                value={newVehicle.color}
                onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                placeholder="Black"
              />
            </div>
            <div>
              <label className={label} htmlFor="v-plate">
                Licence plate
              </label>
              <input
                id="v-plate"
                className={field}
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                placeholder="PCX 1234"
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* 3. Date & time */}
      <section className={cardBase} aria-labelledby="step-when">
        <h2 id="step-when" className="font-display text-lg font-semibold">
          3. Date &amp; time
        </h2>
        <div className="mt-4 max-w-xs">
          <label className={label} htmlFor="b-date">
            Date
          </label>
          <input
            id="b-date"
            type="date"
            className={field}
            min={todayInTT()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setStartsAt("");
            }}
          />
        </div>
        {slots.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking availability…</p>
        ) : slots.isError ? (
          <p className="mt-4 text-sm text-destructive">Availability didn't load. Try another date.</p>
        ) : slots.data?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {slots.data.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                disabled={!slot.available}
                aria-pressed={startsAt === slot.startsAt}
                onClick={() => setStartsAt(slot.startsAt)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  startsAt === slot.startsAt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            We're closed on Sundays — please pick another date.
          </p>
        )}
      </section>

      {/* 4. Contact & location */}
      <section className={cardBase} aria-labelledby="step-where">
        <h2 id="step-where" className="font-display text-lg font-semibold">
          4. Contact &amp; location
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="c-name">
              Full name
            </label>
            <input
              id="c-name"
              className={field}
              value={contact.contactName}
              onChange={(e) => setContact({ ...contact, contactName: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor="c-phone">
              Phone
            </label>
            <input
              id="c-phone"
              className={field}
              inputMode="tel"
              value={contact.contactPhone}
              onChange={(e) => setContact({ ...contact, contactPhone: e.target.value })}
              placeholder="868 000 0000"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="c-address">
              Address
            </label>
            <input
              id="c-address"
              className={field}
              value={contact.addressLine}
              onChange={(e) => setContact({ ...contact, addressLine: e.target.value })}
              placeholder="12 Maraval Road"
            />
          </div>
          <div>
            <label className={label} htmlFor="c-city">
              City / area
            </label>
            <input
              id="c-city"
              className={field}
              value={contact.city}
              onChange={(e) => setContact({ ...contact, city: e.target.value })}
              placeholder="Port of Spain"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="c-notes">
              Notes (optional)
            </label>
            <textarea
              id="c-notes"
              rows={3}
              className={field}
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              placeholder="Gate code, parking, problem areas…"
            />
          </div>
        </div>
      </section>

      {/* 5. Confirm */}
      <section className={cardBase} aria-labelledby="step-confirm">
        <h2 id="step-confirm" className="font-display text-lg font-semibold">
          5. Confirm
        </h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className={label}>Service</dt>
            <dd className="mt-1">{service ? service.name : "Not selected"}</dd>
          </div>
          <div>
            <dt className={label}>When</dt>
            <dd className="mt-1">{startsAt ? formatDateTime(startsAt) : "Not selected"}</dd>
          </div>
          <div>
            <dt className={label}>Total</dt>
            <dd className="mt-1 text-primary">
              {service
                ? formatTTD(quote.data?.totalPriceCents ?? service.basePriceCents)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className={label}>Payment</dt>
            <dd className="mt-1 text-muted-foreground">On completion — card, transfer or cash</dd>
          </div>
        </dl>

        {authLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Checking your account…</p>
        ) : user ? (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-50 sm:w-auto"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Confirm booking
          </button>
        ) : (
          <div className="mt-6 rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Sign in to confirm your appointment and apply any member discount.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-gold px-7 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
            >
              Sign in to book
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
