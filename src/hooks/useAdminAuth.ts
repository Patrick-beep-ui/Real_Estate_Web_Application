"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const TEST_USER: User = {
  id: "test-user-id",
  email: "test@test.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { name: "Test Admin" },
} as User;

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (TEST_MODE) {
      setUser(TEST_USER);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Single initial auth check with timeout to prevent hanging
    Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getSession timeout after 10s")), 10000)
      ),
    ])
      .then(async ({ data: { session } }) => {
        if (!isMounted) return;
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            try {
              const { data: roles, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", currentUser.id)
                .eq("role", "admin");

              if (error) {
                console.error("Failed to fetch user roles on load:", error);
              }
              if (isMounted) setIsAdmin(!!roles && roles.length > 0);
            } catch (err) {
              console.error("Role fetch failed:", err);
              if (isMounted) setIsAdmin(false);
            }
          } else {
            if (isMounted) setIsAdmin(false);
          }
        } catch (err) {
          console.error("getSession callback error:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("getSession failed or timed out:", err);
        if (isMounted) setLoading(false);
      });

    // Separate listener for auth changes (token refresh, sign out from other tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const { data: roles, error } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentUser.id)
              .eq("role", "admin");

            if (error) {
              console.error("Failed to fetch user roles:", error);
            }
            setIsAdmin(!!roles && roles.length > 0);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (TEST_MODE) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, loading, signOut, testMode: TEST_MODE };
}
