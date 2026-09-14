"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PlanCard from "@/components/PlanCard";
import ErrorNotice from "@/components/ErrorNotice";
import type { Plan } from "@/lib/types";

export default function TeacherOnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState("");
  const [classes, setClasses] = useState("");
  const [boards, setBoards] = useState("CBSE");
  const [experience, setExperience] = useState(0);
  const [bio, setBio] = useState("");

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

        const [plansRes, tpRes] = await Promise.all([
          supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("teacher_profiles").select("*").eq("id", user.id).single(),
        ]);
        if (plansRes.error) throw plansRes.error;
        if (tpRes.error) throw tpRes.error;

        setPlans((plansRes.data as Plan[]) ?? []);
        const tp = tpRes.data;
        if (tp) {
          setSubjects((tp.subjects ?? []).join(", "));
          setClasses(tp.classes ?? "");
          setBoards(tp.boards || "CBSE");
          setExperience(tp.experience_years ?? 0);
          setBio(tp.bio ?? "");
          setPlanId(tp.plan_id);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!planId) {
      setError("Please choose a plan to continue.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setSaving(false);
      return;
    }
    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("teacher_profiles")
      .update({
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        classes,
        boards,
        experience_years: experience,
        bio,
        plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/teacher/payment");
  }

  if (loading) {
    return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  }
  if (loadError) {
    return <ErrorNotice message={loadError} />;
  }

  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="font-display text-2xl font-semibold text-navy-950">Complete your tutor profile</h1>
      <p className="mt-1 text-navy-600">This is what parents will see. Fill it in honestly — it's how you get matched.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="subjects">Subjects you teach</label>
            <input id="subjects" required placeholder="Mathematics, Science, English" className="field-input" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
            <p className="mt-1 text-xs text-navy-400">Comma-separated.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="classes">Classes you teach</label>
              <input id="classes" required placeholder="e.g. Class 6–10" className="field-input" value={classes} onChange={(e) => setClasses(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="boards">Boards</label>
              <select id="boards" className="field-input" value={boards} onChange={(e) => setBoards(e.target.value)}>
                <option>CBSE</option>
                <option>ICSE</option>
                <option>State Board</option>
                <option>All boards</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="experience">Years of teaching experience</label>
            <input id="experience" type="number" min={0} className="field-input" value={experience} onChange={(e) => setExperience(Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label" htmlFor="bio">Short bio</label>
            <textarea id="bio" rows={4} className="field-input" placeholder="Tell parents about your teaching style…" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-navy-950">Choose your plan</h2>
          <p className="mt-1 text-sm text-navy-600">You'll pay by UPI on the next step — we verify it manually, usually within a few hours.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={planId === p.id} onSelect={() => setPlanId(p.id)} />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Continue to payment"}
        </button>
      </form>
    </div>
  );
}
