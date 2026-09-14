"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ErrorNotice from "@/components/ErrorNotice";
import type { Plan } from "@/lib/types";

export default function TeacherPaymentPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("Scholar Academy");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [copied, setCopied] = useState(false);

  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

        const [settingsRes, tpRes] = await Promise.all([
          supabase.from("payment_settings").select("*").eq("id", 1).single(),
          supabase.from("teacher_profiles").select("plan_id, plans(*)").eq("id", user.id).single(),
        ]);
        if (settingsRes.error) throw settingsRes.error;
        if (tpRes.error) throw tpRes.error;

        const settings = settingsRes.data;
        const tp = tpRes.data;
        if (settings) {
          setUpiId(settings.upi_id);
          setUpiName(settings.upi_name);
          setQrUrl(settings.qr_url);
        }
        if (tp && !tp.plan_id) {
          router.push("/teacher/onboarding");
          return;
        }
        // @ts-expect-error - supabase join typing
        setPlan(tp?.plans ?? null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, router]);

  function copyUpi() {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!utr.trim()) {
      setError("Enter the UTR / transaction reference number from your UPI payment.");
      return;
    }

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
    if (!user || !plan) {
      setSubmitting(false);
      return;
    }

    let screenshotUrl: string | null = null;
    if (file) {
      const path = `payment-proofs/${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }
      screenshotUrl = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
    }

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price,
      utr_reference: utr.trim(),
      screenshot_url: screenshotUrl,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  }
  if (loadError) {
    return <ErrorNotice message={loadError} />;
  }

  if (submitted) {
    return (
      <div className="container-page max-w-md py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-navy-950">Payment submitted</h1>
        <p className="mt-2 text-navy-600">
          We'll verify your UPI payment and activate your profile shortly — usually within a few hours.
        </p>
        <button onClick={() => router.push("/teacher/dashboard")} className="btn-primary mt-6">
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-lg py-14">
      <h1 className="font-display text-2xl font-semibold text-navy-950">Pay for the {plan?.name} plan</h1>
      <p className="mt-1 text-navy-600">Pay via UPI, then submit your transaction reference below. We verify manually.</p>

      <div className="card mt-6 p-6">
        <p className="text-sm text-navy-500">Amount to pay</p>
        <p className="font-display text-3xl font-semibold text-navy-950">₹{plan?.price}</p>

        <div className="mt-5 flex items-center justify-between rounded-md border border-navy-100 bg-navy-50 px-4 py-3">
          <div>
            <p className="text-xs text-navy-500">Pay to UPI ID</p>
            <p className="font-medium text-navy-900">{upiId}</p>
            <p className="text-xs text-navy-500">{upiName}</p>
          </div>
          <button onClick={copyUpi} type="button" className="btn-outline">
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {qrUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="UPI QR code" className="mx-auto mt-5 h-44 w-44 rounded-md border border-navy-100" />
        )}
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="field-label" htmlFor="utr">UTR / transaction reference number</label>
          <input id="utr" required className="field-input" placeholder="e.g. 402816xxxxxx" value={utr} onChange={(e) => setUtr(e.target.value)} />
          <p className="mt-1 text-xs text-navy-400">Found in your UPI app's payment history / success screen.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="screenshot">Payment screenshot (optional but recommended)</label>
          <label htmlFor="screenshot" className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-navy-300 px-4 py-3 text-sm text-navy-600 hover:border-gold-400">
            <UploadCloud size={16} /> {file ? file.name : "Upload a screenshot"}
          </label>
          <input id="screenshot" type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Submitting…" : "I've paid — submit for verification"}
        </button>
      </form>
    </div>
  );
}
