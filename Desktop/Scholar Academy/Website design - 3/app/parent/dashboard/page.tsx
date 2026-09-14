"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import ErrorNotice from "@/components/ErrorNotice";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TuitionRequest } from "@/lib/types";

export default function ParentDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<TuitionRequest[]>([]);

  const [studentClass, setStudentClass] = useState("");
  const [subjects, setSubjects] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRequests(userId: string) {
    const { data, error: fetchError } = await supabase
      .from("requests")
      .select("*, teacher_profiles(*, profiles(*))")
      .eq("parent_id", userId)
      .order("created_at", { ascending: false });
    if (fetchError) throw fetchError;
    setRequests((data as TuitionRequest[]) ?? []);
  }

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          router.push("/login");
          return;
        }
        const { data: p, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        if (p?.role !== "parent") {
          router.push("/");
          return;
        }
        setProfile(p as Profile);
        setArea(p.area ?? "");
        await loadRequests(user.id);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load your dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error: insertError } = await supabase.from("requests").insert({
        parent_id: user.id,
        teacher_id: null,
        student_class: studentClass,
        subjects,
        area,
        notes,
        status: "open",
      });
      if (insertError) throw insertError;

      setStudentClass("");
      setSubjects("");
      setNotes("");
      await loadRequests(user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  }
  if (loadError) {
    return <ErrorNotice message={loadError} />;
  }

  return (
    <div>
      <Navbar />
      <div className="container-page max-w-3xl py-12">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Welcome, {profile?.full_name}</h1>
        <p className="mt-1 text-navy-600">
          <Link href="/teachers" className="font-medium text-navy-900 underline">Browse tutors</Link> directly, or tell us what you need below.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">Post a tuition request</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="studentClass">Student's class</label>
              <input id="studentClass" required className="field-input" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="area">Your area</label>
              <input id="area" required className="field-input" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="subjects">Subjects needed</label>
            <input id="subjects" required className="field-input" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="notes">Anything else? (optional)</label>
            <textarea id="notes" rows={3} className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Sending…" : "Post request"}
          </button>
        </form>

        <h2 className="mt-10 font-display text-lg font-semibold text-navy-950">Your requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No requests yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-navy-900">
                    Class {r.student_class} · {r.subjects}
                  </p>
                  <p className="text-sm text-navy-500">
                    {r.area} {r.teacher_profiles?.profiles?.full_name ? `· Requested: ${r.teacher_profiles.profiles.full_name}` : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
