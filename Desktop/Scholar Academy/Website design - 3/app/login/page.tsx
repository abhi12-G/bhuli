"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const next = params.get("next");
    const dest =
      next ??
      (profile?.role === "admin"
        ? "/admin/dashboard"
        : profile?.role === "teacher"
        ? "/teacher/dashboard"
        : "/parent/dashboard");

    router.push(dest);
    router.refresh();
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
          <h1 className="font-display text-xl font-semibold text-navy-950">Log in</h1>
          <p className="mt-1 text-sm text-navy-500">Welcome back.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-navy-500">
          New here?{" "}
          <Link href="/register" className="font-medium text-navy-800 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
