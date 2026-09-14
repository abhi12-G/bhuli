"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/plans", label: "Plans & UPI" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-navy-100">
      <div className="container-page flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              pathname === t.href
                ? "border-gold-500 text-navy-950"
                : "border-transparent text-navy-500 hover:text-navy-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
