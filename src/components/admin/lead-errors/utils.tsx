import { Badge } from "@/components/ui/badge";
import { classifyError } from "@/lib/leads/error-classification";

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatSlug(slug: string | null) {
  return slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
}

export function getErrorBadge(code: string | null) {
  if (!code) return <Badge variant="outline" className="text-xs border-border text-muted-foreground">UNKNOWN</Badge>;
  if (code.startsWith("GHL")) {
    if (code === "GHL_FETCH_ERROR") return <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 bg-amber-500/10">{code}</Badge>;
    return <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400 bg-orange-500/10">{code}</Badge>;
  }
  return <Badge variant="outline" className="text-xs border-red-500/40 text-red-400 bg-red-500/10">{code}</Badge>;
}

export function getRiskBadge(code: string | null) {
  const cat = classifyError(code);
  if (cat === "transient") return <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/30">Transient</Badge>;
  if (cat === "structural") return <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">Structural</Badge>;
  return <Badge variant="outline" className="text-xs text-muted-foreground">Unknown</Badge>;
}

export function formatErrorDetails(details: string | null) {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
}
