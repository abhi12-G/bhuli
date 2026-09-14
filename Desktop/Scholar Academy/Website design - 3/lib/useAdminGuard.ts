"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAdminGuard() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
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
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        if (profile?.role !== "admin") {
          router.push("/");
          return;
        }
        if (active) setReady(true);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Something went wrong loading this page.");
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  return { ready, error, supabase };
}

