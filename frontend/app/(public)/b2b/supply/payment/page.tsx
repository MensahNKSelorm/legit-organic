"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function PaymentResult() {
  const search = useSearchParams();
  const cycleId = Number(search.get("cycle"));
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Confirming the payment with the provider…");

  useEffect(() => {
    if (!cycleId) {
      void Promise.resolve().then(() => {
        setState("error");
        setMessage("This payment link is incomplete.");
      });
      return;
    }
    api.b2b.supply
      .verifyPayment(cycleId)
      .then(() => {
        setState("paid");
        setMessage("Payment confirmed. The delivery is now being prepared.");
      })
      .catch((reason) => {
        const text = reason instanceof Error ? reason.message : "";
        if (/verification failed|pending/i.test(text)) {
          setState("pending");
          setMessage(
            "Payment is still being confirmed. You can return to the agreement and check again shortly."
          );
        } else {
          setState("error");
          setMessage(text || "Payment could not be confirmed.");
        }
      });
  }, [cycleId]);

  return (
    <div className="max-w-2xl border-t border-[#B9AD98] pt-8 text-center dark:border-white/20">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#2E7D32] dark:text-[#F4C430]">
        Business supply payment
      </p>
      <h1 className="display-organic mt-4 text-5xl md:text-7xl">
        {state === "checking"
          ? "Checking payment."
          : state === "paid"
            ? "Payment received."
            : state === "pending"
              ? "Confirmation pending."
              : "Payment needs attention."}
      </h1>
      <p
        role={state === "error" ? "alert" : undefined}
        className="mx-auto mt-6 max-w-lg leading-7 text-[#675E52] dark:text-[#AFC0B2]"
      >
        {message}
      </p>
      <Link
        href={`/b2b/supply/manage`}
        className="mt-8 inline-block bg-[#173C2A] px-6 py-4 font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]"
      >
        Return to supply agreements
      </Link>
    </div>
  );
}

export default function BusinessSupplyPaymentPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 py-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white">
      <Suspense fallback={<p>Checking payment…</p>}>
        <PaymentResult />
      </Suspense>
    </main>
  );
}
