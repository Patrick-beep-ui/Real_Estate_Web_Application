// /src/hooks/useAdminAuth.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [roleLoading, setRoleLoading] = useState(true);
  
  // Ref para asegurar que no lancemos peticiones idénticas al mismo tiempo
  const checkRoleRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    const failsafe = setTimeout(() => {
      if (isMounted && (loading || roleLoading)) {
        console.warn("Auth check timed out. Forcing UI unblock.");
        setLoading(false);
        setRoleLoading(false);
      }
    }, 3500);

    const verifyUser = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setRoleLoading(false);
          setLoading(false);
        }
        return;
      }

      setUser(sessionUser);

      // Si ya estamos revisando el rol, abortamos para evitar colisión de Fetch
      if (checkRoleRef.current) return;
      checkRoleRef.current = true;

      try {
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sessionUser.id)
          .eq("role", "admin")
          .maybeSingle(); 

        if (error && error.code !== 'PGRST116') throw error;

        if (isMounted) setIsAdmin(!!roles);
      } catch (err) {
        console.error("Error checking role:", err);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) {
          setRoleLoading(false);
          setLoading(false);
        }
        checkRoleRef.current = false; // Liberamos el candado
      }
    };

    // Obtenemos la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) verifyUser(session?.user ?? null);
    });

    // Escuchamos cambios (Solo respondemos a eventos explícitos, no al setup inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
          verifyUser(session?.user ?? null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
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