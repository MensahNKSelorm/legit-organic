"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LocationPicker from "@/components/ui/LocationPicker";

export interface GuestData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  house_number: string;
  street_address: string;
  city: string;
  delivery_region: string;
  latitude?: number;
  longitude?: number;
}

interface GuestOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guestData: GuestData) => void;
  checkoutMode: "seevcash" | "whatsapp";
}

const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
  "International",
];

const PHONE_RE = /^(\+233|0)[0-9]{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<Record<keyof GuestData, string>>;

export default function GuestOrderModal({
  isOpen,
  onClose,
  onSubmit,
  checkoutMode,
}: GuestOrderModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState("");

  const [showMap, setShowMap] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhoneNumber("");
        setHouseNumber("");
        setStreetAddress("");
        setCity("");
        setDeliveryRegion("");
        setLatitude(null);
        setLongitude(null);
        setErrors({});
      });
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!firstName.trim()) next.first_name = "First name is required.";
    if (!lastName.trim()) next.last_name = "Last name is required.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!phoneNumber.trim()) {
      next.phone_number = "Phone number is required.";
    } else if (!PHONE_RE.test(phoneNumber.replace(/\s/g, ""))) {
      next.phone_number = "Enter a valid Ghana number e.g. +233244123456 or 0244123456";
    }
    if (!streetAddress.trim()) next.street_address = "Street address is required.";
    if (!city.trim()) next.city = "City is required.";
    if (!deliveryRegion) next.delivery_region = "Please select a region.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone_number: phoneNumber.replace(/\s/g, ""),
      house_number: houseNumber.trim(),
      street_address: streetAddress.trim(),
      city: city.trim(),
      delivery_region: deliveryRegion,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
  };

  if (!isOpen) return null;

  const inputBase =
    "min-h-11 w-full border bg-[#F5F0E6] px-3.5 py-2.5 text-sm text-[#0D3B2A] outline-2 outline-transparent placeholder:text-[#5B3E31]/55 transition-[border-color,background-color] hover:border-[#0D3B2A]/40 focus:border-[#2E7D32] focus:bg-[#FEFCF7] focus:outline-none focus-visible:outline-[#F4C430] focus-visible:outline-offset-2 dark:bg-[#222A24] dark:text-[#FAF7F0] dark:placeholder:text-[#B8D4BD]/55 dark:hover:border-white/30 dark:focus:border-[#F4C430] dark:focus:bg-[#273029]";
  const inputOk = `${inputBase} border-[#0D3B2A]/20 dark:border-white/15`;
  const inputErr = `${inputBase} border-red-500 dark:border-red-400`;
  const labelClass = "mb-1.5 block text-sm font-semibold text-[#0D3B2A] dark:text-[#FAF7F0]";
  const errorClass = "mt-1.5 text-xs font-medium text-red-700 dark:text-red-300";
  const isWhatsApp = checkoutMode === "whatsapp";

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[#071E15]/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-order-title"
        aria-describedby="guest-order-description"
        className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-5"
      >
        <div
          className="pointer-events-auto flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden border border-[#0D3B2A]/20 bg-[#FAF7F0] shadow-[0_24px_80px_rgba(7,30,21,.28)] sm:max-h-[90dvh] dark:border-white/15 dark:bg-[#171B18] dark:shadow-[0_24px_80px_rgba(0,0,0,.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between bg-[#0D3B2A] px-5 py-5 text-white sm:px-7 sm:py-6">
            <div className="min-w-0 pr-4">
              <h2
                id="guest-order-title"
                className="display-organic text-3xl text-white sm:text-4xl"
              >
                Order details
              </h2>
              <p id="guest-order-description" className="mt-1.5 text-sm text-[#D8E7DB]">
                Checkout without creating an account.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close order details"
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/25 text-2xl leading-none text-white transition-colors hover:border-[#F4C430] hover:bg-[#F4C430] hover:text-[#0D3B2A] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D3B2A] focus-visible:outline-none active:bg-[#E2B426]"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
              <fieldset>
                <legend className="mb-4 flex w-full items-center gap-3 text-sm font-bold text-[#0D3B2A] dark:text-[#FAF7F0]">
                  <span>Your details</span>
                  <span className="h-px flex-1 bg-[#0D3B2A]/15 dark:bg-white/15" aria-hidden />
                </legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-first-name" className={labelClass}>
                      First name <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-first-name"
                      name="given-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setErrors((p) => ({ ...p, first_name: undefined }));
                      }}
                      placeholder="Kofi"
                      className={errors.first_name ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.first_name)}
                      aria-describedby={errors.first_name ? "guest-first-name-error" : undefined}
                    />
                    {errors.first_name && (
                      <p id="guest-first-name-error" className={errorClass}>
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="guest-last-name" className={labelClass}>
                      Last name <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-last-name"
                      name="family-name"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setErrors((p) => ({ ...p, last_name: undefined }));
                      }}
                      placeholder="Mensah"
                      className={errors.last_name ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.last_name)}
                      aria-describedby={errors.last_name ? "guest-last-name-error" : undefined}
                    />
                    {errors.last_name && (
                      <p id="guest-last-name-error" className={errorClass}>
                        {errors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="guest-email" className={labelClass}>
                      Email <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="you@example.com"
                      className={errors.email ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "guest-email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="guest-email-error" className={errorClass}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="guest-phone" className={labelClass}>
                      Phone number <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setErrors((p) => ({ ...p, phone_number: undefined }));
                      }}
                      placeholder="024 412 3456"
                      className={errors.phone_number ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.phone_number)}
                      aria-describedby="guest-phone-help"
                    />
                    {errors.phone_number ? (
                      <p id="guest-phone-help" className={errorClass}>
                        {errors.phone_number}
                      </p>
                    ) : (
                      <p
                        id="guest-phone-help"
                        className="mt-1.5 text-xs text-[#5B3E31]/70 dark:text-[#B8D4BD]/70"
                      >
                        Ghana number, with or without +233.
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-4 flex w-full items-center gap-3 text-sm font-bold text-[#0D3B2A] dark:text-[#FAF7F0]">
                  <span>Delivery</span>
                  <span className="h-px flex-1 bg-[#0D3B2A]/15 dark:bg-white/15" aria-hidden />
                </legend>

                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  aria-expanded={showMap}
                  className="mb-5 flex min-h-11 w-full items-center justify-between gap-3 border border-[#2E7D32]/45 bg-[#2E7D32]/5 px-4 py-3 text-left text-sm font-semibold text-[#146C38] transition-[border-color,background-color] hover:border-[#2E7D32] hover:bg-[#2E7D32]/10 focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#2E7D32]/15 dark:border-[#81C784]/35 dark:bg-[#81C784]/10 dark:text-[#A9DCAD] dark:hover:border-[#81C784]/70 dark:hover:bg-[#81C784]/15 dark:active:bg-[#81C784]/20"
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 shrink-0"
                      aria-hidden
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {showMap ? "Map location is open" : "Use the map to fill your address"}
                  </span>
                  <span className="shrink-0 text-xs underline underline-offset-4">
                    {showMap ? "Hide map" : "Open map"}
                  </span>
                </button>

                {showMap && (
                  <div className="mb-5 overflow-hidden border border-[#0D3B2A]/15 dark:border-white/15">
                    <LocationPicker
                      appearance="embedded"
                      onLocationSelect={(data) => {
                        if (data.street_address) setStreetAddress(data.street_address);
                        setHouseNumber(data.house_number || "");
                        if (data.city) setCity(data.city);
                        if (data.delivery_region) setDeliveryRegion(data.delivery_region);
                        if (data.latitude) setLatitude(data.latitude);
                        if (data.longitude) setLongitude(data.longitude);
                      }}
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-house-number" className={labelClass}>
                      House or apartment
                    </label>
                    <input
                      id="guest-house-number"
                      name="address-line1"
                      type="text"
                      autoComplete="address-line1"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="A14, Flat 3"
                      className={inputOk}
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-street-address" className={labelClass}>
                      Street address <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-street-address"
                      name="address-line2"
                      type="text"
                      autoComplete="address-line2"
                      value={streetAddress}
                      onChange={(e) => {
                        setStreetAddress(e.target.value);
                        setErrors((p) => ({ ...p, street_address: undefined }));
                      }}
                      placeholder="12 Independence Avenue"
                      className={errors.street_address ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.street_address)}
                      aria-describedby={errors.street_address ? "guest-street-error" : undefined}
                    />
                    {errors.street_address && (
                      <p id="guest-street-error" className={errorClass}>
                        {errors.street_address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="guest-city" className={labelClass}>
                      Town or city <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <input
                      id="guest-city"
                      name="address-level2"
                      type="text"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setErrors((p) => ({ ...p, city: undefined }));
                      }}
                      placeholder="Accra"
                      className={errors.city ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "guest-city-error" : undefined}
                    />
                    {errors.city && (
                      <p id="guest-city-error" className={errorClass}>
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="guest-region" className={labelClass}>
                      Region <span className="text-red-600 dark:text-red-300">*</span>
                    </label>
                    <select
                      id="guest-region"
                      name="address-level1"
                      autoComplete="address-level1"
                      value={deliveryRegion}
                      onChange={(e) => {
                        setDeliveryRegion(e.target.value);
                        setErrors((p) => ({ ...p, delivery_region: undefined }));
                      }}
                      className={errors.delivery_region ? inputErr : inputOk}
                      aria-invalid={Boolean(errors.delivery_region)}
                      aria-describedby={errors.delivery_region ? "guest-region-error" : undefined}
                    >
                      <option value="">Select region…</option>
                      {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {errors.delivery_region && (
                      <p id="guest-region-error" className={errorClass}>
                        {errors.delivery_region}
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <div className="border-l-2 border-[#F4C430] pl-4 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">
                Your contact and address are used to confirm this order and arrange delivery.
              </div>
            </div>

            <div className="shrink-0 border-t border-[#0D3B2A]/15 bg-[#F5F0E6] px-5 py-4 sm:px-7 sm:py-5 dark:border-white/15 dark:bg-[#1D231F]">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 border border-[#0D3B2A]/30 px-5 py-3 text-sm font-semibold text-[#0D3B2A] transition-colors hover:border-[#0D3B2A] hover:bg-[#FAF7F0] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#E6D8BD]/55 dark:border-white/25 dark:text-[#FAF7F0] dark:hover:border-white/50 dark:hover:bg-white/5 dark:active:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 flex-1 bg-[#0D3B2A] px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-[#174F3A] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#071E15] disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs dark:bg-[#F4C430] dark:text-[#0D3B2A] dark:hover:bg-[#E2B426] dark:active:bg-[#C59F2C]"
                >
                  {isWhatsApp ? "Continue in WhatsApp" : "Continue to secure payment"}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-[#5B3E31]/75 sm:text-right dark:text-[#B8D4BD]/75">
                Already have an account?{" "}
                <Link
                  href="/login"
                  onClick={onClose}
                  className="font-semibold text-[#146C38] underline-offset-4 hover:underline dark:text-[#A9DCAD]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
