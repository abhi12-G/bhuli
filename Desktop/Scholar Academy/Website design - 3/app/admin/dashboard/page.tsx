"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/AdminNav";
import ErrorNotice from "@/components/ErrorNotice";
import { useAdminGuard } from "@/lib/useAdminGuard";

export default function AdminDashboardPage() {
  const { ready, error, supabase } = useAdminGuard();
  const [stats, setStats] = useState({
    teachersActive: 0,
    teachersPending: 0,
    paymentsPending: 0,
    requestsOpen: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    async function load() {
      try {
        const [active, pendingReview, paymentsPending, requestsOpen] = await Promise.all([
          supabase.from("teacher_profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("teacher_profiles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "open"),
        ]);
        if (active.error) throw active.error;
        if (pendingReview.error) throw pendingReview.error;
        if (paymentsPending.error) throw paymentsPending.error;
        if (requestsOpen.error) throw requestsOpen.error;
        setStats({
          teachersActive: active.count ?? 0,
          teachersPending: pendingReview.count ?? 0,
          paymentsPending: paymentsPending.count ?? 0,
          requestsOpen: requestsOpen.count ?? 0,
        });
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load stats.");
      }
    }
    load();
  }, [ready, supabase]);

  if (error) return <ErrorNotice message={error} />;
  if (!ready) return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  if (loadError) return <ErrorNotice message={loadError} />;

  const cards = [
    { label: "Active teachers", value: stats.teachersActive },
    { label: "Teachers awaiting review", value: stats.teachersPending },
    { label: "Payments to verify", value: stats.paymentsPending },
    { label: "Open parent requests", value: stats.requestsOpen },
  ];

  return (
    <div>
      <Navbar />
      <AdminNav />
      <div className="container-page py-10">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Overview</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="card p-5">
              <p className="font-display text-3xl font-semibold text-navy-950">{c.value}</p>
              <p className="mt-1 text-sm text-navy-500">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
