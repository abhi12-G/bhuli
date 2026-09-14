"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (active) setRole(null);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (active) setRole((profile?.role as Role) ?? null);
      } catch {
        if (active) setRole(null);
      } finally {
        if (active) setLoaded(true);
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const dashboardHref = role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/parent/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/80 bg-parchment/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 text-gold-400">
            <GraduationCap size={20} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-navy-900">
            Scholar Academy
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-navy-700 md:flex">
          <Link href="/#subjects" className="hover:text-navy-950">Classes</Link>
          <Link href="/#why-us" className="hover:text-navy-950">Why us</Link>
          <Link href="/teachers" className="hover:text-navy-950">Find a tutor</Link>
          <Link href="/#teach" className="hover:text-navy-950">Teach with us</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loaded && role ? (
            <>
              <Link href={dashboardHref} className="btn-outline">Dashboard</Link>
              <button onClick={logout} className="btn-dark">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline">Log in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-parchment px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-navy-700">
            <Link href="/#subjects" onClick={() => setOpen(false)}>Classes</Link>
            <Link href="/#why-us" onClick={() => setOpen(false)}>Why us</Link>
            <Link href="/teachers" onClick={() => setOpen(false)}>Find a tutor</Link>
            <Link href="/#teach" onClick={() => setOpen(false)}>Teach with us</Link>
            <div className="mt-2 flex gap-3">
              {loaded && role ? (
                <>
                  <Link href={dashboardHref} className="btn-outline flex-1">Dashboard</Link>
                  <button onClick={logout} className="btn-dark flex-1">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-outline flex-1">Log in</Link>
                  <Link href="/register" className="btn-primary flex-1">Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
