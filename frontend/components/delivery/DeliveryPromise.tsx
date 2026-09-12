"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { DeliveryZone } from "@/types";

function nextDelivery(zone: DeliveryZone) {
  const now = new Date();
  const date = new Date(now);
  // DeliveryZone stores Monday as 0; Date#getDay stores Sunday as 0.
  const weekday = (now.getDay() + 6) % 7;
  let days = (zone.delivery_weekday - weekday + 7) % 7;
  date.setDate(now.getDate() + days);
  date.setHours(0, 0, 0, 0);
  const cutoff = new Date(date.getTime() - zone.cutoff_hours * 60 * 60 * 1000);
  if (cutoff <= now) {
    days += 7;
    date.setDate(date.getDate() + 7);
  }
  return date.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "short" });
}

export default function DeliveryPromise({
  compact = false,
  inverted = false,
  subtotal,
}: {
  compact?: boolean;
  inverted?: boolean;
  subtotal?: number;
}) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  useEffect(() => {
    api.subscriptions
      .zones()
      .then((items) => {
        setZones(items);
        const saved = sessionStorage.getItem("lo_delivery_zone");
        if (saved && items.some((item) => String(item.id) === saved)) setZoneId(saved);
      })
      .catch(() => setZones([]));
  }, []);
  const zone = useMemo(() => zones.find((item) => String(item.id) === zoneId), [zones, zoneId]);

  return (
    <div
      className={
        compact
          ? "border-t border-[#E6D8BD] pt-4 dark:border-white/15"
          : "border-y border-[#0D3B2A]/20 py-6 dark:border-white/15"
      }
    >
      <label
        className={`block text-xs font-bold ${inverted ? "text-white" : "text-[#0D3B2A] dark:text-white"}`}
      >
        Check delivery before checkout
        <select
          value={zoneId}
          onChange={(event) => {
            setZoneId(event.target.value);
            if (event.target.value) sessionStorage.setItem("lo_delivery_zone", event.target.value);
            else sessionStorage.removeItem("lo_delivery_zone");
          }}
          className="mt-2 block w-full border border-[#0D3B2A]/25 bg-[#FEFCF7] px-3 py-3 text-sm text-[#0D3B2A] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:outline-none dark:border-white/20 dark:bg-[#171B18] dark:text-white"
        >
          <option value="">Choose your delivery area</option>
          {zones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {zone && (
        <p
          className={`mt-3 text-xs leading-5 ${inverted ? "text-[#D5E7D8]" : "text-[#5B3E31] dark:text-[#B8D4BD]"}`}
        >
          <strong className={inverted ? "text-white" : "text-[#0D3B2A] dark:text-white"}>
            Next delivery: {nextDelivery(zone)}
          </strong>
          <br />
          GH₵ {Number(zone.delivery_fee).toFixed(2)} delivery · orders close {zone.cutoff_hours}{" "}
          hours before delivery.
          {subtotal !== undefined && (
            <>
              <br />
              <strong className={inverted ? "text-white" : "text-[#0D3B2A] dark:text-white"}>
                Estimated total: GH₵ {(subtotal + Number(zone.delivery_fee)).toFixed(2)}
              </strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}
