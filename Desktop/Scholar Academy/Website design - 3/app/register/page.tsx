"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "teacher" ? "teacher" : "parent";

  const [role, setRole] = useState<Extract<Role, "teacher" | "parent">>(initialRole);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName, phone, area },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is switched on in the Supabase project settings.
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    router.push(role === "teacher" ? "/teacher/onboarding" : "/parent/dashboard");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-5 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-xl font-semibold text-navy-950">Check your email</h1>
          <p className="mt-2 text-sm text-navy-600">
            We've sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in.
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-flex">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 text-gold-400">
            <GraduationCap size={20} />
          </span>
          <span className="font-display text-lg font-semibold text-navy-900">Scholar Academy</span>
        </Link>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold text-navy-950">Create an account</h1>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-navy-50 p-1">
            <button
              type="button"
              onClick={() => setRole("parent")}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                role === "parent" ? "bg-white text-navy-900 shadow-sm" : "text-navy-500"
              }`}
            >
              I'm a parent
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                role === "teacher" ? "bg-white text-navy-900 shadow-sm" : "text-navy-500"
              }`}
            >
              I'm a teacher
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="field-label" htmlFor="fullName">Full name</label>
              <input id="fullName" required className="field-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="phone">Phone</label>
                <input id="phone" required className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="area">Area</label>
                <input id="area" required placeholder="e.g. Boring Road" className="field-input" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : `Sign up as ${role === "teacher" ? "a teacher" : "a parent"}`}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-navy-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy-800 underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
