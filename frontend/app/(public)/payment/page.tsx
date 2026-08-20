"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function PaymentResult() {
  const params = useSearchParams();
  const reference = params.get("reference") || undefined;
  const orderReference = params.get("order") || undefined;
  const [message, setMessage] = useState("Confirming your payment…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reference && !orderReference) {
      Promise.resolve().then(() => {
        setFailed(true);
        setMessage("Payment reference is missing.");
      });
      return;
    }
    api.orders
      .verifyPayment(reference, orderReference)
      .then(() => setMessage("Payment confirmed. Your order is now being processed."))
      .catch((reason) => {
        setFailed(true);
        setMessage(reason instanceof Error ? reason.message : "Payment could not be confirmed.");
      });
  }, [reference, orderReference]);

  return (
    <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20">
      <p
        className={`text-sm font-bold ${failed ? "text-red-700 dark:text-red-300" : "text-[#2E7D32] dark:text-[#F4C430]"}`}
      >
        {message}
      </p>
      <Link
        href="/profile"
        className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]"
      >
        View my orders
      </Link>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 text-[#173C2A] dark:bg-[#171B18] dark:text-white">
      <Suspense fallback={<p>Confirming payment…</p>}>
        <PaymentResult />
      </Suspense>
    </main>
  );
}
