"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import ErrorNotice from "@/components/ErrorNotice";
import { useAdminGuard } from "@/lib/useAdminGuard";
import type { TeacherProfile, TuitionRequest } from "@/lib/types";

export default function AdminRequestsPage() {
  const { ready, error, supabase } = useAdminGuard();
  const [requests, setRequests] = useState<TuitionRequest[]>([]);
  const [activeTeachers, setActiveTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [reqsRes, teachersRes] = await Promise.all([
      supabase
        .from("requests")
        .select("*, profiles!requests_parent_id_fkey(*), teacher_profiles(*, profiles(*))")
        .order("created_at", { ascending: false }),
      supabase.from("teacher_profiles").select("*, profiles(*)").eq("status", "active"),
    ]);
    if (reqsRes.error) {
      setLoadError(reqsRes.error.message);
      setLoading(false);
      return;
    }
    if (teachersRes.error) {
      setLoadError(teachersRes.error.message);
      setLoading(false);
      return;
    }
    setRequests((reqsRes.data as TuitionRequest[]) ?? []);
    setActiveTeachers((teachersRes.data as TeacherProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function assign(requestId: string, teacherId: string) {
    await supabase.from("requests").update({ teacher_id: teacherId, status: "matched" }).eq("id", requestId);
    load();
  }

  async function close(requestId: string) {
    await supabase.from("requests").update({ status: "closed" }).eq("id", requestId);
    load();
  }

  if (error) return <ErrorNotice message={error} />;
  if (!ready) return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  if (loadError) return <ErrorNotice message={loadError} />;

  return (
    <div>
      <Navbar />
      <AdminNav />
      <div className="container-page py-10">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Parent requests</h1>

        {loading ? (
          <p className="mt-8 text-navy-500">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="mt-8 text-navy-500">No requests yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy-900">
                      {r.profiles?.full_name} · Class {r.student_class}
                    </p>
                    <p className="text-sm text-navy-500">{r.subjects} · {r.area}</p>
                    {r.notes && <p className="mt-1 text-sm text-navy-600">{r.notes}</p>}
                    <p className="mt-1 text-xs text-navy-400">{r.profiles?.phone}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                {r.teacher_profiles?.profiles?.full_name && (
                  <p className="mt-3 text-sm text-navy-700">
                    Assigned to: <span className="font-medium">{r.teacher_profiles.profiles.full_name}</span>
                  </p>
                )}

                {r.status !== "closed" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <select
                      className="field-input w-auto"
                      defaultValue=""
                      onChange={(e) => e.target.value && assign(r.id, e.target.value)}
                    >
                      <option value="" disabled>Assign a tutor…</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.profiles?.full_name}</option>
                      ))}
                    </select>
                    <button onClick={() => close(r.id)} className="btn-outline">Close request</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
