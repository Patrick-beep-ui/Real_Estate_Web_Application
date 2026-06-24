"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function PreviewClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, loading } = useAdminAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  console.log("Preview UI State:", { loading, isRedirecting, hasUser: !!user, isAdmin });

  useEffect(() => {
    if (loading === false) {
      if (!user || !isAdmin) {
        router.replace("/admin/login");
      }
    }
  }, [loading, user, isAdmin, router]);

  if (!user || !isAdmin) return null;

  return <>{children}</>;
}
