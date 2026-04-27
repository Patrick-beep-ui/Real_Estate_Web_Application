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
  const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {

    if (TEST_MODE) {
      setUser(TEST_USER);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

      let isMounted = true;

      const init = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          console.log("USER:", user);

          if (!isMounted) return;

          setUser(user ?? null);

          if (user) {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .eq("role", "admin");

              console.log("User roles:", roles)

            setIsAdmin(!!roles && roles.length > 0);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (isMounted) {
            setLoading(false);
            setRoleLoading(false);
          }
        }
      };

      init();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!isMounted) return;

          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentUser.id)
              .eq("role", "admin");

            setIsAdmin(!!roles && roles.length > 0);
          } else {
            setIsAdmin(false);
          }
          setRoleLoading(false);
          setLoading(false);
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

  return { user, isAdmin, loading, roleLoading, signOut, testMode: TEST_MODE };
}
