"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import ErrorNotice from "@/components/ErrorNotice";
import { useAdminGuard } from "@/lib/useAdminGuard";
import type { Payment, PaymentStatus } from "@/lib/types";

export default function AdminPaymentsPage() {
  const { ready, error, supabase } = useAdminGuard();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("payments")
      .select("*, profiles(*), plans(*)")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setLoadError(fetchError.message);
      setLoading(false);
      return;
    }
    setPayments((data as Payment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function verify(p: Payment) {
    await supabase
      .from("payments")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", p.id);

    // Verified payment activates the teacher's listing.
    await supabase
      .from("teacher_profiles")
      .update({ status: "active" })
      .eq("id", p.user_id);

    load();
  }

  async function reject(p: Payment) {
    await supabase.from("payments").update({ status: "rejected" }).eq("id", p.id);
    load();
  }

  if (error) return <ErrorNotice message={error} />;
  if (!ready) return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  if (loadError) return <ErrorNotice message={loadError} />;

  const visible = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  return (
    <div>
      <Navbar />
      <AdminNav />
      <div className="container-page py-10">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Payments</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending", "verified", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize ${
                filter === f ? "border-navy-900 bg-navy-900 text-parchment" : "border-navy-200 text-navy-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-navy-500">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-navy-500">Nothing here.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {visible.map((p) => (
              <div key={p.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-navy-900">{p.profiles?.full_name}</p>
                  <p className="text-sm text-navy-500">
                    ₹{p.amount} · {p.plans?.name} · UTR: <span className="font-mono">{p.utr_reference}</span>
                  </p>
                  <p className="text-xs text-navy-400">{new Date(p.created_at).toLocaleString()}</p>
                  {p.screenshot_url && (
                    <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-navy-800 underline">
                      View screenshot
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => verify(p)} className="btn-primary">Verify</button>
                      <button onClick={() => reject(p)} className="btn-outline">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
