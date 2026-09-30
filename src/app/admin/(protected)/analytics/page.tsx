"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import type { AnalyticsStats } from "@/server/modules/analytics/analytics.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  new: "#EAB308",
  contacted: "#3B82F6",
  qualified: "#A855F7",
  closed: "#22C55E",
  lost: "#EF4444",
};

function formatSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const AdminAnalytics = () => {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["admin-analytics-stats"],
    queryFn: () => adminApi.get<AnalyticsStats>("/api/admin/analytics"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive text-lg font-semibold">Failed to load analytics</p>
        <p className="text-muted-foreground text-sm">{(error as Error)?.message || "Unknown error"}</p>
      </div>
    );
  }

  const timeData = (stats?.timeSeries ?? []).map(({ date, count }) => ({
    date: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count,
  }));

  const marketData = (stats?.topMarkets ?? []).map(({ name, count }) => ({
    name: formatSlug(name),
    count,
  }));

  const situationData = (stats?.topSituations ?? []).map(({ name, count }) => ({
    name: formatSlug(name),
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-3xl font-bold text-primary">{stats?.conversionRate ?? 0}%</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Leads - Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 7%)",
                  border: "1px solid hsl(0 0% 18%)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "hsl(0 0% 100%)" }}
                itemStyle={{ color: "hsl(38 92% 50%)" }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats?.statusBreakdown ?? []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {(stats?.statusBreakdown ?? []).map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marketData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                <XAxis type="number" tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 18%)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Situations</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={situationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 7%)",
                  border: "1px solid hsl(0 0% 18%)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;