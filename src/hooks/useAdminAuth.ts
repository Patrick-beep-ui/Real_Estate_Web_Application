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
    let isMounted = true;

    const checkRole = async (userId: string) => {
      try {
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(); 

        if (error) throw error;

        if (isMounted) {
          setIsAdmin(!!roles);
        }
      } catch (err) {
        console.error("Error in checkRole:", err);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) {
          setRoleLoading(false);
          setLoading(false);
        }
      }
    };

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await checkRole(session.user.id);
        } else {
          if (isMounted) {
            setUser(null);
            setIsAdmin(false);
            setRoleLoading(false);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error in auth:", err);
        if (isMounted) {
          setRoleLoading(false);
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await checkRole(currentUser.id);
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          setRoleLoading(false);
          setLoading(false);
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

  return { user, isAdmin, loading: loading || roleLoading, signOut }; 
}