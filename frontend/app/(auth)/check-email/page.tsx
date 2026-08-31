"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-forest-green border-t-transparent rounded-full animate-spin"
      aria-hidden
    />
  );
}

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { resendVerification } = useAuth();

  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleResend = async () => {
    setResendState("loading");
    try {
      await resendVerification(email);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] pt-[76px] text-[#0D3B2A] dark:bg-[#171B18] dark:text-[#FAF7F0]">
      <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative flex min-h-[54vh] flex-col justify-between overflow-hidden px-6 py-12 md:px-12 md:py-16 lg:px-[8vw] lg:py-20">
          <div
            className="absolute -right-16 top-24 h-72 w-72 rotate-12 border border-[#0D3B2A]/10 dark:border-white/10"
            aria-hidden
          />
          <p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">One last step</p>
          <div className="relative max-w-3xl py-12">
            <h1 className="display-organic text-[3.55rem] leading-[.9] sm:text-7xl lg:text-[clamp(5.5rem,7vw,7.5rem)] lg:leading-[.84]">
              Your place
              <br />
              at the table
              <br />
              <em className="font-normal text-[#2E7D32] dark:text-[#F4C430]">is nearly ready.</em>
            </h1>
          </div>
          {email && (
            <div className="border-t editorial-rule pt-5">
              <p className="text-xs text-[#5B3E31] dark:text-[#B8D4BD]">Verification sent to</p>
              <p className="mt-1 break-all text-lg font-bold">{email}</p>
            </div>
          )}
        </section>

        <section className="flex items-center bg-[#0D3B2A] px-6 py-16 text-white md:px-12 lg:px-[7vw]">
          <div className="w-full max-w-xl">
            <svg
              viewBox="0 0 64 42"
              className="h-12 w-20 text-[#F4C430]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M1 1h62v40H1z" />
              <path d="m2 3 30 23L62 3" />
            </svg>
            <h2 className="display-organic mt-10 text-5xl md:text-6xl">Open your inbox.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Use the link in the email to confirm the account. If it is not in your inbox, check
              spam before requesting another.
            </p>

            <div className="mt-12 border-t border-white/20 pt-7">
              {resendState === "sent" ? (
                <p className="text-sm font-bold text-[#F4C430]">A fresh link is on its way.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === "loading"}
                  className="flex items-center gap-3 border-b border-white/55 pb-1 text-sm font-bold transition-colors hover:border-[#F4C430] hover:text-[#F4C430] disabled:opacity-50"
                >
                  {resendState === "loading" ? (
                    <>
                      <Spinner /> Sending…
                    </>
                  ) : (
                    "Send another verification email ↗"
                  )}
                </button>
              )}
              {resendState === "error" && (
                <p className="mt-4 text-sm text-red-300">
                  That did not send. Please try once more.
                </p>
              )}
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/products"
                className="bg-[#F4C430] px-7 py-4 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#E2B426]"
              >
                Browse while you wait
              </Link>
              <Link
                href="/signup"
                className="border-b border-white/45 pb-1 text-sm text-white/70 hover:text-white"
              >
                Wrong email? Start again
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
