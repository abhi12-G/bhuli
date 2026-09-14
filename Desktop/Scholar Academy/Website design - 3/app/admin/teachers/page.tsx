"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import ErrorNotice from "@/components/ErrorNotice";
import { useAdminGuard } from "@/lib/useAdminGuard";
import type { TeacherProfile, TeacherStatus } from "@/lib/types";

const filters: { key: TeacherStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Awaiting review" },
  { key: "active", label: "Active" },
  { key: "pending_payment", label: "Awaiting payment" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminTeachersPage() {
  const { ready, error, supabase } = useAdminGuard();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [filter, setFilter] = useState<TeacherStatus | "all">("pending_review");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("teacher_profiles")
      .select("*, profiles(*), plans(*)")
      .order("updated_at", { ascending: false });
    if (fetchError) {
      setLoadError(fetchError.message);
      setLoading(false);
      return;
    }
    setTeachers((data as TeacherProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function setStatus(id: string, status: TeacherStatus, note?: string) {
    await supabase.from("teacher_profiles").update({ status, admin_note: note ?? null }).eq("id", id);
    load();
  }

  if (error) return <ErrorNotice message={error} />;
  if (!ready) return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  if (loadError) return <ErrorNotice message={loadError} />;

  const visible = filter === "all" ? teachers : teachers.filter((t) => t.status === filter);

  return (
    <div>
      <Navbar />
      <AdminNav />
      <div className="container-page py-10">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Teachers</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                filter === f.key ? "border-navy-900 bg-navy-900 text-parchment" : "border-navy-200 text-navy-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-navy-500">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-navy-500">Nothing here.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {visible.map((t) => (
              <div key={t.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy-900">{t.profiles?.full_name}</p>
                    <p className="text-sm text-navy-500">
                      {t.profiles?.phone} · {t.profiles?.area} · {t.profiles?.email}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="mt-3 grid gap-1 text-sm text-navy-700 sm:grid-cols-2">
                  <p><span className="text-navy-500">Subjects:</span> {(t.subjects ?? []).join(", ") || "—"}</p>
                  <p><span className="text-navy-500">Classes:</span> {t.classes || "—"}</p>
                  <p><span className="text-navy-500">Boards:</span> {t.boards || "—"}</p>
                  <p><span className="text-navy-500">Experience:</span> {t.experience_years} yrs</p>
                  <p><span className="text-navy-500">Plan:</span> {t.plans?.name ?? "—"}</p>
                </div>
                {t.bio && <p className="mt-2 text-sm text-navy-600">{t.bio}</p>}

                {t.status === "pending_review" && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setStatus(t.id, "active")} className="btn-primary">Approve</button>
                    <button onClick={() => setStatus(t.id, "rejected", "Profile not approved by admin.")} className="btn-outline">Reject</button>
                  </div>
                )}
                {t.status === "active" && (
                  <div className="mt-4">
                    <button onClick={() => setStatus(t.id, "rejected", "Deactivated by admin.")} className="btn-outline">Deactivate</button>
                  </div>
                )}
                {t.status === "rejected" && (
                  <div className="mt-4">
                    <button onClick={() => setStatus(t.id, "active")} className="btn-outline">Reactivate</button>
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
