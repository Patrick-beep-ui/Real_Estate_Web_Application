"use client";

import { useDeferredValue, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportTrackingCsv, exportTrackingXlsx } from "@/lib/tracking/admin-export";
import {
  type TrackingDeliveryEvent,
  type TrackingSubmission,
  useTrackingSubmissions,
} from "@/hooks/tracking/useTrackingSubmissions";

const GHL_SERVICES = ["ghl_contact", "ghl_opportunity"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sourceFor(submission: TrackingSubmission) {
  return submission.source || submission.utm_source || submission.traffic_classification;
}

function latestEvent(submission: TrackingSubmission, services: string[]) {
  return [...submission.events].reverse().find((event) => services.includes(event.service));
}

function hasSuccessfulEvent(submission: TrackingSubmission, services: string[]) {
  return submission.events.some((event) => services.includes(event.service) && event.outcome === "succeeded");
}

function DeliveryOutcomeBadge({ event }: { event?: TrackingDeliveryEvent }) {
  if (!event) return <Badge variant="secondary">Not logged</Badge>;

  const variant = event.outcome === "succeeded"
    ? "default"
    : event.outcome === "failed"
      ? "destructive"
      : "secondary";

  return <Badge variant={variant}>{event.outcome}</Badge>;
}

function DetailValue({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-sm">{value}</p>
    </div>
  );
}

function TrackingStats({ submissions, isLoading }: { submissions: TrackingSubmission[]; isLoading: boolean }) {
  const stats = [
    { label: "Submissions", value: submissions.length },
    { label: "Accepted forms", value: submissions.filter((submission) => submission.form_status === "accepted").length },
    { label: "GHL delivered", value: submissions.filter((submission) => hasSuccessfulEvent(submission, GHL_SERVICES)).length },
    { label: "Meta CAPI delivered", value: submissions.filter((submission) => hasSuccessfulEvent(submission, ["meta_capi"])).length },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{isLoading ? "-" : stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrackingTable({
  submissions,
  isLoading,
  onSelect,
}: {
  submissions: TrackingSubmission[];
  isLoading: boolean;
  onSelect: (submission: TrackingSubmission) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>GHL</TableHead>
              <TableHead>Meta CAPI</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  Loading audit records...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !submissions.length && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No tracking records match these filters.
                </TableCell>
              </TableRow>
            )}
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(submission.created_at)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{sourceFor(submission)}</p>
                  <p className="max-w-40 truncate text-xs text-muted-foreground">
                    {submission.utm_campaign || submission.page_path || "-"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={submission.form_status === "accepted" ? "default" : submission.form_status === "failed" ? "destructive" : "secondary"}>
                    {submission.form_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DeliveryOutcomeBadge event={latestEvent(submission, GHL_SERVICES)} />
                </TableCell>
                <TableCell>
                  <DeliveryOutcomeBadge event={latestEvent(submission, ["meta_capi"])} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(submission)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SubmissionDetails({ submission, onClose }: { submission: TrackingSubmission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close details" className="absolute inset-0 bg-black/80" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Submission audit</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(submission.created_at)}</p>
          </div>
          <Button aria-label="Close details" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-8 space-y-8">
          <section>
            <h3 className="font-semibold">Delivery timeline</h3>
            <div className="mt-4 space-y-3">
              {submission.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium capitalize">
                    {event.service.replace(/_/g, " ")} - {event.operation}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(event.completed_at || event.created_at)} · {event.outcome}{event.http_status ? ` · HTTP ${event.http_status}` : ""}
                  </p>
                  {event.external_reference && (
                    <p className="mt-1 break-all text-xs text-muted-foreground">Reference: {event.external_reference}</p>
                  )}
                  {event.error_message && (
                    <p className="mt-1 text-sm text-destructive">
                      {event.error_code ? `${event.error_code}: ` : ""}{event.error_message}
                    </p>
                  )}
                </div>
              ))}
              {!submission.events.length && (
                <p className="text-sm text-muted-foreground">No delivery events were recorded.</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="font-semibold">Attribution</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailValue label="Meta event ID" value={submission.meta_event_id} />
              <DetailValue label="Lead ID" value={submission.lead_id} />
              <DetailValue label="FBCLID" value={submission.fbclid} />
              <DetailValue label="FBC" value={submission.fbc} />
              <DetailValue label="FBP" value={submission.fbp} />
              <DetailValue label="Meta campaign ID" value={submission.fb_campaign_id} />
              <DetailValue label="Meta ad set ID" value={submission.fb_adset_id} />
              <DetailValue label="Meta ad ID" value={submission.fb_ad_id} />
              <DetailValue label="UTM campaign" value={submission.utm_campaign} />
              <DetailValue label="GCLID" value={submission.gclid} />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function TrackingPage() {
  const { data: submissions = [], isLoading, isError, error } = useTrackingSubmissions();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<TrackingSubmission | null>(null);
  const deferredSource = useDeferredValue(source);

  const sources = Array.from(new Set(submissions.map(sourceFor))).sort();
  const statuses = Array.from(new Set(submissions.map((submission) => submission.form_status))).sort();
  const filteredSubmissions = submissions.filter((submission) => {
    const date = submission.created_at.slice(0, 10);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate) &&
      (deferredSource === "all" || sourceFor(submission) === deferredSource) &&
      (status === "all" || submission.form_status === status);
  });

  if (isError) {
    return (
      <div className="py-20 text-center text-destructive">
        Failed to load tracking records: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submission Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only delivery audit records for form submissions.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={!filteredSubmissions.length}>
              <Download className="h-4 w-4" />Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportTrackingCsv(filteredSubmissions)}>Export CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void exportTrackingXlsx(filteredSubmissions)}>Export XLSX</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TrackingStats submissions={filteredSubmissions} isLoading={isLoading} />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <select aria-label="Traffic source" value={source} onChange={(event) => setSource(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">All sources</option>
            {sources.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Form status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">All form statuses</option>
            {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </CardContent>
      </Card>
      <TrackingTable submissions={filteredSubmissions} isLoading={isLoading} onSelect={setSelected} />
      {selected && <SubmissionDetails submission={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
