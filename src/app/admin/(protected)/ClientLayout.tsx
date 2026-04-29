// /admin/(protected)/ClientLayout.tsx (o tu layout.tsx actual si usas "use client")
"use client";      

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  
  const [isRedirecting, setIsRedirecting] = useState(false);

  console.log("Admin UI State:", { loading, isRedirecting, hasUser: !!user, isAdmin });

  useEffect(() => {
    if (!loading && !isRedirecting) {
      if (!user || !isAdmin) {
        console.log("Access denied, locking UI and redirecting...");
        setIsRedirecting(true);
        router.replace("/admin/login");
      }
    }
  }, [loading, user, isAdmin, router, isRedirecting]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <SidebarProvider>
        <div className="h-screen flex w-full bg-background overflow-hidden">
          <AdminSidebar user={user} onSignOut={signOut} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="shrink-0 p-4 flex items-center border-b border-border bg-card">
              <SidebarTrigger className="mr-4" />
              <span className="text-sm font-semibold text-foreground">
                Tarek Buys Houses — Admin
              </span>
            </header>
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminErrorBoundary>
  );
}