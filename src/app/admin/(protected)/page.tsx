"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import type { OverviewStats } from "@/server/modules/overview/overview.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, CheckCircle, AlertTriangle, Send, XCircle } from "lucide-react";

const AdminOverview = () => {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: () => adminApi.get<OverviewStats>("/api/admin/overview"),
    refetchInterval: 60_000,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive text-lg font-semibold">Failed to load dashboard</p>
        <p className="text-muted-foreground text-sm">{(error as Error)?.message || "Unknown error"}</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Leads", value: stats?.total ?? 0, icon: Users, color: "text-primary" },
    { label: "Today", value: stats?.todayCount ?? 0, icon: TrendingUp, color: "text-green-500" },
    { label: "New / Uncontacted", value: stats?.newCount ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "Closed Won", value: stats?.closedCount ?? 0, icon: CheckCircle, color: "text-primary" },
    { label: "Failed Submissions", value: stats?.errorCount ?? 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  // Drip health card — surfaces silent SMS/email pipeline breakage (e.g. Twilio 401, Resend domain unverified)
  const dripFailing = (stats?.dripFailRate ?? 0) >= 50 && (stats?.dripsFailed ?? 0) >= 3;
  const dripHealthColor = dripFailing
    ? "border-destructive"
    : stats?.dripsFailed ?? 0 > 0
    ? "border-yellow-500/50"
    : "border-border";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drip health — last 24h */}
      <Card className={`bg-card ${dripHealthColor} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Drip Pipeline Health · Last 24 Hours
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Tracks SMS + email follow-up sends. Silent failures here = leads going cold.
            </p>
          </div>
          {dripFailing && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-bold">
              <XCircle className="h-3.5 w-3.5" /> Pipeline degraded
            </span>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-16 w-full bg-muted animate-pulse rounded" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sent</p>
                <p className="text-2xl font-bold text-green-500">{stats?.dripsSent ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Failed</p>
                <p className={`text-2xl font-bold ${(stats?.dripsFailed ?? 0) > 0 ? "text-destructive" : "text-foreground"}`}>
                  {stats?.dripsFailed ?? 0}
                </p>
                {(stats?.dripsFailed ?? 0) > 0 && (
                  <p className="text-xs text-destructive mt-0.5">{stats?.dripFailRate}% fail rate</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{stats?.dripsPending ?? 0}</p>
              </div>
            </div>
          )}
          {dripFailing && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              <strong>Action needed:</strong> Most drips are failing. Check Twilio credentials in Connectors,
              and verify the Resend sending domain (tarekbuyshouses.com) is approved.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
