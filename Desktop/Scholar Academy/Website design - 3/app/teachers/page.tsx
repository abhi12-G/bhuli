"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import TeacherCard from "@/components/TeacherCard";
import ErrorNotice from "@/components/ErrorNotice";
import { createClient } from "@/lib/supabase/client";
import type { TeacherProfile } from "@/lib/types";

export default function TeachersDirectoryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [query, setQuery] = useState("");
  const [isParent, setIsParent] = useState<boolean | null>(null);
  const [requestFor, setRequestFor] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: fetchError } = await supabase
          .from("teacher_profiles")
          .select("*, profiles(*)")
          .eq("status", "active");
        if (fetchError) throw fetchError;
        setTeachers((data as TeacherProfile[]) ?? []);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (user) {
          const { data: p, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profileError) throw profileError;
          setIsParent(p?.role === "parent");
        } else {
          setIsParent(false);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load tutors.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      [t.profiles?.full_name, t.profiles?.area, t.classes, t.boards, ...(t.subjects ?? [])]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [teachers, query]);

  return (
    <div>
      <Navbar />
      <div className="container-page py-12">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Find a tutor</h1>
        <p className="mt-1 text-navy-600">Verified tutors currently taking students across Patna.</p>

        <div className="relative mt-6 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            className="field-input pl-10"
            placeholder="Search by subject, class, or area…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="mt-10 text-navy-500">Loading tutors…</p>
        ) : loadError ? (
          <ErrorNotice message={loadError} />
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-navy-500">No tutors match yet — check back soon or widen your search.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TeacherCard
                key={t.id}
                teacher={t}
                action={
                  <button onClick={() => setRequestFor(t)} className="btn-primary mt-1 w-full">
                    Request this tutor
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      {requestFor && (
        <RequestModal
          teacher={requestFor}
          isParent={isParent}
          onClose={() => setRequestFor(null)}
        />
      )}
    </div>
  );
}

function RequestModal({
  teacher,
  isParent,
  onClose,
}: {
  teacher: TeacherProfile;
  isParent: boolean | null;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [studentClass, setStudentClass] = useState("");
  const [subjects, setSubjects] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setSubmitting(false);
      return;
    }
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("requests").insert({
      parent_id: user.id,
      teacher_id: teacher.id,
      student_class: studentClass,
      subjects,
      area,
      notes,
      status: "open",
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    setDone(true);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 px-5">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            Request {teacher.profiles?.full_name}
          </h2>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {isParent === false ? (
          <div className="mt-4 text-sm text-navy-600">
            <p>Log in as a parent to request a tutor.</p>
            <Link href="/login" className="btn-primary mt-4 inline-flex">Log in</Link>
          </div>
        ) : done ? (
          <p className="mt-4 text-sm text-navy-600">
            Sent! We've notified this tutor and our team — you'll hear back shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="studentClass">Student's class</label>
              <input id="studentClass" required className="field-input" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="subjects">Subjects needed</label>
              <input id="subjects" required className="field-input" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="area">Your area</label>
              <input id="area" required className="field-input" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="notes">Anything else? (optional)</label>
              <textarea id="notes" rows={3} className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending…" : "Send request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
