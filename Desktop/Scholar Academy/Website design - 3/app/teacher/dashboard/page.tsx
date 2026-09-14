"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import ErrorNotice from "@/components/ErrorNotice";
import { createClient } from "@/lib/supabase/client";
import type { TeacherProfile, TuitionRequest, Profile } from "@/lib/types";

export default function TeacherDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tp, setTp] = useState<TeacherProfile | null>(null);
  const [requests, setRequests] = useState<TuitionRequest[]>([]);

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

        const [pRes, tpRes, reqsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("teacher_profiles").select("*, plans(*)").eq("id", user.id).single(),
          supabase
            .from("requests")
            .select("*, profiles!requests_parent_id_fkey(*)")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: false }),
        ]);
        if (pRes.error) throw pRes.error;
        if (tpRes.error) throw tpRes.error;
        if (reqsRes.error) throw reqsRes.error;

        if (pRes.data?.role !== "teacher") {
          router.push("/");
          return;
        }

        setProfile(pRes.data as Profile);
        setTp(tpRes.data as TeacherProfile);
        setRequests((reqsRes.data as TuitionRequest[]) ?? []);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load your dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, router]);

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

        <div className="card mt-6 p-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-navy-900">Profile status</p>
            {tp && <StatusBadge status={tp.status} />}
          </div>

          {tp?.status === "pending_payment" && (
            <p className="mt-3 text-sm text-navy-600">
              Finish setting up your profile and pay for your plan to go live.{" "}
              <Link href="/teacher/onboarding" className="font-medium text-navy-900 underline">Complete profile</Link>
              {" · "}
              <Link href="/teacher/payment" className="font-medium text-navy-900 underline">Pay now</Link>
            </p>
          )}
          {tp?.status === "pending_review" && (
            <p className="mt-3 text-sm text-navy-600">Your payment is being verified. This usually takes a few hours.</p>
          )}
          {tp?.status === "active" && (
            <p className="mt-3 text-sm text-navy-600">You're live! Parents in your area can now find and request you.</p>
          )}
          {tp?.status === "rejected" && (
            <p className="mt-3 text-sm text-red-600">
              Your profile wasn't approved{tp.admin_note ? `: ${tp.admin_note}` : "."} Contact us on WhatsApp for details.
            </p>
          )}

          {tp?.plans && (
            <p className="mt-3 text-sm text-navy-500">
              Plan: <span className="font-medium text-navy-800">{tp.plans.name}</span> · ₹{tp.plans.price}
            </p>
          )}

          <Link href="/teacher/onboarding" className="btn-outline mt-4">Edit profile</Link>
        </div>

        <h2 className="mt-10 font-display text-lg font-semibold text-navy-950">Requests from parents</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No requests yet — they'll show up here once a parent picks you.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-navy-900">{r.profiles?.full_name} · Class {r.student_class}</p>
                  <p className="text-sm text-navy-500">{r.subjects} · {r.area}</p>
                  {r.notes && <p className="mt-1 text-sm text-navy-600">{r.notes}</p>}
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
