"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function ManageDeliveriesLink() {
  const { isAuthenticated, isLoading } = useAuth();
  const href = isAuthenticated ? "/subscriptions/manage" : "/login?next=/subscriptions/manage";

  if (isLoading) {
    return (
      <span className="mt-6 inline-flex border-b border-current pb-1 text-sm font-bold opacity-45">
        Manage my deliveries
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="mt-6 inline-flex border-b border-current pb-1 text-sm font-bold transition-colors hover:text-[#2E7D32] dark:hover:text-[#F4C430]"
    >
      Manage my deliveries
    </Link>
  );
}
