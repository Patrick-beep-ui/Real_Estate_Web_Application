"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
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

const AdminAnalytics = () => {
  const { data: leads } = useQuery({
    queryKey: ["admin-analytics-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, status, market_slug, situation_slug, source, created_at");
      if (error) throw error;
      return data;
    },
  });

  // Status breakdown
  const statusData = Object.entries(
    (leads || []).reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Top markets
  const marketData = Object.entries(
    (leads || []).reduce<Record<string, number>>((acc, l) => {
      const market = l.market_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      acc[market] = (acc[market] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Top situations
  const situationData = Object.entries(
    (leads || []).reduce<Record<string, number>>((acc, l) => {
      const sit = l.situation_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      acc[sit] = (acc[sit] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Leads over time (last 14 days)
  const timeData = (() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    (leads || []).forEach((l) => {
      const day = l.created_at.split("T")[0];
      if (day in days) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    }));
  })();

  // Conversion rate
  const total = leads?.length || 0;
  const closed = leads?.filter((l) => l.status === "closed").length || 0;
  const convRate = total > 0 ? ((closed / total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-3xl font-bold text-primary">{convRate}%</p>
        </div>
      </div>

      {/* Leads over time */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Leads — Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8 }}
                labelStyle={{ color: "hsl(0 0% 100%)" }}
                itemStyle={{ color: "hsl(38 92% 50%)" }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top markets */}
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
                  contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top situations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Situations</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={situationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8 }}
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
