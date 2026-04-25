"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  Brain,
  TrendingUp,
  Home,
  Repeat,
  Building2,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const CATEGORY_CONFIG = {
  cash_buy: {
    label: "Cash Buy",
    icon: Home,
    color: "text-green-400",
    bg: "bg-green-400/10",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  wholesale: {
    label: "Wholesale",
    icon: Repeat,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  rental_hold: {
    label: "Rental Hold",
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
} as const;

function useLeadMetrics() {
  return useQuery({
    queryKey: ["admin-scaling-metrics"],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [allLeads, todayLeads, weekLeads, scoredLeads] = await Promise.all([
        supabase.from("leads").select("id, lead_category, lead_score, scoring_reason, scored_at, auto_routed, status, created_at, name, phone, market_slug, situation_slug").order("created_at", { ascending: false }).limit(200),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).not("lead_category", "is", null),
      ]);

      const leads = allLeads.data || [];
      const categoryBreakdown = {
        cash_buy: leads.filter((l) => l.lead_category === "cash_buy").length,
        wholesale: leads.filter((l) => l.lead_category === "wholesale").length,
        rental_hold: leads.filter((l) => l.lead_category === "rental_hold").length,
        unscored: leads.filter((l) => !l.lead_category).length,
      };

      const avgScore = leads.filter((l) => l.lead_score != null).reduce((sum, l) => sum + (l.lead_score || 0), 0) / (leads.filter((l) => l.lead_score != null).length || 1);

      const autoRouted = leads.filter((l) => l.auto_routed).length;

      // Top markets
      const marketCounts: Record<string, number> = {};
      leads.forEach((l) => {
        marketCounts[l.market_slug] = (marketCounts[l.market_slug] || 0) + 1;
      });
      const topMarkets = Object.entries(marketCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      return {
        totalLeads: leads.length,
        todayCount: todayLeads.count || 0,
        weekCount: weekLeads.count || 0,
        scoredCount: scoredLeads.count || 0,
        categoryBreakdown,
        avgScore: Math.round(avgScore),
        autoRouted,
        topMarkets,
        recentLeads: leads.slice(0, 20),
      };
    },
    refetchInterval: 15000, // Live refresh every 15s
  });
}

export default function AdminScaling() {
  const { data: metrics, isLoading } = useLeadMetrics();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Brain className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading scaling engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Scaling Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI lead scoring • Auto-routing • Real-time pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pulse ? "bg-green-400" : "bg-green-600"} transition-colors`} />
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Today</p>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold mt-2">{metrics.todayCount}</p>
            <p className="text-xs text-muted-foreground mt-1">new leads</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">This Week</p>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold mt-2">{metrics.weekCount}</p>
            <p className="text-xs text-muted-foreground mt-1">leads captured</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Scored</p>
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold mt-2">{metrics.scoredCount}</p>
            <p className="text-xs text-muted-foreground mt-1">of {metrics.totalLeads} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold mt-2">{metrics.avgScore}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {(["cash_buy", "wholesale", "rental_hold"] as const).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const count = metrics.categoryBreakdown[cat];
          const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;

          return (
            <Card key={cat} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{pct}% of pipeline</p>
                  </div>
                </div>
                <p className="text-4xl font-bold mb-2">{count}</p>
                <Progress value={pct} className="h-1.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auto-Routed + Top Markets */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Auto-Routing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-3xl font-bold">{metrics.autoRouted}</p>
                <p className="text-sm text-muted-foreground">leads auto-routed</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-400">
                  {metrics.totalLeads > 0 ? Math.round((metrics.autoRouted / metrics.totalLeads) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">automation rate</p>
              </div>
            </div>
            {metrics.categoryBreakdown.unscored > 0 && (
              <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400">
                  ⚠ {metrics.categoryBreakdown.unscored} leads not yet scored
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Top Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topMarkets.map(([market, count], i) => (
                <div key={market} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {market.replace(/-/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={(count / metrics.totalLeads) * 100} className="w-20 h-1.5" />
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scored Leads */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recent Leads (Live Feed)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Situation</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Routed</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.recentLeads.map((lead) => {
                const cat = lead.lead_category as keyof typeof CATEGORY_CONFIG | null;
                const config = cat ? CATEGORY_CONFIG[cat] : null;

                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="capitalize text-sm">
                      {lead.market_slug.replace(/-/g, " ")}
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {lead.situation_slug.replace(/-/g, " ")}
                    </TableCell>
                    <TableCell>
                      {config ? (
                        <Badge variant="outline" className={config.badge}>
                          {config.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.lead_score != null ? (
                        <span className={`font-bold ${lead.lead_score >= 70 ? "text-green-400" : lead.lead_score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                          {lead.lead_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.auto_routed ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
