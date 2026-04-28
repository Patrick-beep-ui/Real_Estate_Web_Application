"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isAdmin, loading, roleLoading, signOut } = useAdminAuth();

  console.log("Is user admin?:", isAdmin)
  console.log("Is role loading?", roleLoading)  

  useEffect(() => {
    if (!loading && !roleLoading && (!user || !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [loading, roleLoading, user, isAdmin]);

  // only block FULL render when truly loading initial auth
  /*
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
    */

  // if not authenticated, don't render layout at all
    if (!user || !isAdmin) {
      return null;
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
};

export default AdminLayout;