"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/AdminNav";
import ErrorNotice from "@/components/ErrorNotice";
import { useAdminGuard } from "@/lib/useAdminGuard";
import type { Plan } from "@/lib/types";

const emptyForm = {
  name: "",
  price: 0,
  commission_percent: 0,
  billing_cycle: "one_time" as Plan["billing_cycle"],
  description: "",
  features: "",
  sort_order: 0,
};

export default function AdminPlansPage() {
  const { ready, error, supabase } = useAdminGuard();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [savingUpi, setSavingUpi] = useState(false);

  async function load() {
    const [plansRes, settingsRes] = await Promise.all([
      supabase.from("plans").select("*").order("sort_order"),
      supabase.from("payment_settings").select("*").eq("id", 1).single(),
    ]);
    if (plansRes.error) {
      setLoadError(plansRes.error.message);
      return;
    }
    if (settingsRes.error) {
      setLoadError(settingsRes.error.message);
      return;
    }
    setPlans((plansRes.data as Plan[]) ?? []);
    if (settingsRes.data) {
      setUpiId(settingsRes.data.upi_id);
      setUpiName(settingsRes.data.upi_name);
      setQrUrl(settingsRes.data.qr_url);
    }
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function startEdit(p: Plan) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      commission_percent: p.commission_percent,
      billing_cycle: p.billing_cycle,
      description: p.description ?? "",
      features: p.features.join(", "),
      sort_order: p.sort_order,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      price: form.price,
      commission_percent: form.commission_percent,
      billing_cycle: form.billing_cycle,
      description: form.description,
      features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
      sort_order: form.sort_order,
    };

    if (editingId) {
      await supabase.from("plans").update(payload).eq("id", editingId);
    } else {
      await supabase.from("plans").insert(payload);
    }
    resetForm();
    await load();
    setSaving(false);
  }

  async function toggleActive(p: Plan) {
    await supabase.from("plans").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }

  async function saveUpi(e: React.FormEvent) {
    e.preventDefault();
    setSavingUpi(true);
    let finalQrUrl = qrUrl;
    if (qrFile) {
      const path = `qr-codes/upi-${Date.now()}-${qrFile.name}`;
      const { error } = await supabase.storage.from("uploads").upload(path, qrFile);
      if (!error) {
        finalQrUrl = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
      }
    }
    await supabase.from("payment_settings").update({ upi_id: upiId, upi_name: upiName, qr_url: finalQrUrl }).eq("id", 1);
    setQrUrl(finalQrUrl);
    setQrFile(null);
    setSavingUpi(false);
  }

  if (error) return <ErrorNotice message={error} />;
  if (!ready) return <div className="container-page py-20 text-center text-navy-500">Loading…</div>;
  if (loadError) return <ErrorNotice message={loadError} />;

  return (
    <div>
      <Navbar />
      <AdminNav />
      <div className="container-page max-w-3xl py-10">
        <h1 className="font-display text-2xl font-semibold text-navy-950">UPI payment details</h1>
        <p className="mt-1 text-sm text-navy-600">Shown to teachers when they pay for a plan.</p>
        <form onSubmit={saveUpi} className="card mt-4 space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="upiId">UPI ID</label>
              <input id="upiId" required className="field-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="upiName">Display name</label>
              <input id="upiName" required className="field-input" value={upiName} onChange={(e) => setUpiName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="qr">QR code image (optional)</label>
            <input id="qr" type="file" accept="image/*" className="field-input" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
            {qrUrl && !qrFile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="Current UPI QR" className="mt-2 h-24 w-24 rounded border border-navy-100" />
            )}
          </div>
          <button type="submit" disabled={savingUpi} className="btn-primary">
            {savingUpi ? "Saving…" : "Save UPI details"}
          </button>
        </form>

        <h1 className="mt-12 font-display text-2xl font-semibold text-navy-950">Plans</h1>
        <div className="mt-4 space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-navy-900">
                  {p.name} — ₹{p.price} ({p.billing_cycle}) {!p.is_active && <span className="text-navy-400">· inactive</span>}
                </p>
                <p className="text-sm text-navy-500">{p.commission_percent}% commission · {p.features.join(", ")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="btn-outline">Edit</button>
                <button onClick={() => toggleActive(p)} className="btn-outline">
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            {editingId ? "Edit plan" : "Add a new plan"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="name">Name</label>
              <input id="name" required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="price">Price (₹)</label>
              <input id="price" type="number" min={0} required className="field-input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field-label" htmlFor="commission">Commission %</label>
              <input id="commission" type="number" min={0} max={100} required className="field-input" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field-label" htmlFor="cycle">Billing cycle</label>
              <select id="cycle" className="field-input" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as Plan["billing_cycle"] })}>
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="description">Description</label>
            <input id="description" className="field-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="features">Features</label>
            <input id="features" placeholder="Comma-separated" className="field-input" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editingId ? "Save changes" : "Add plan"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-outline">Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
