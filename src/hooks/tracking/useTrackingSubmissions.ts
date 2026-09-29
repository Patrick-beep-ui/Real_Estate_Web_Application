"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type TrackingDeliveryEvent = {
  id: string;
  submission_id: string;
  service: string;
  operation: string;
  outcome: string;
  created_at: string;
  completed_at: string | null;
  http_status: number | null;
  external_reference: string | null;
  meta_event_id: string | null;
  meta_events_received: number | null;
  error_code: string | null;
  error_message: string | null;
};

export type TrackingSubmission = {
  id: string;
  created_at: string;
  form_status: string;
  source: string | null;
  page_path: string | null;
  traffic_classification: string;
  is_internal_test: boolean;
  lead_id: string | null;
  meta_event_id: string | null;
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  fb_campaign_id: string | null;
  fb_adset_id: string | null;
  fb_ad_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  msclkid: string | null;
  events: TrackingDeliveryEvent[];
};

const submissionFields = "id, created_at, form_status, source, page_path, traffic_classification, is_internal_test, lead_id, meta_event_id, fbp, fbc, fbclid, fb_campaign_id, fb_adset_id, fb_ad_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, gclid, gbraid, wbraid, msclkid";
const eventFields = "id, submission_id, service, operation, outcome, created_at, completed_at, http_status, external_reference, meta_event_id, meta_events_received, error_code, error_message";

export function useTrackingSubmissions() {
  return useQuery({
    queryKey: ["admin-tracking-submissions"],
    queryFn: async () => {
      const { data: submissionData, error: submissionError } = await supabase
        .from("tracking_submissions" as never)
        .select(submissionFields)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (submissionError) throw submissionError;

      const submissions = (submissionData ?? []) as unknown as Omit<TrackingSubmission, "events">[];
      if (!submissions.length) return [] as TrackingSubmission[];

      const { data: eventData, error: eventError } = await supabase
        .from("tracking_delivery_events" as never)
        .select(eventFields)
        .in("submission_id", submissions.map((submission) => submission.id))
        .order("created_at", { ascending: true });
      if (eventError) throw eventError;

      const eventsBySubmission = new Map<string, TrackingDeliveryEvent[]>();
      for (const event of (eventData ?? []) as unknown as TrackingDeliveryEvent[]) {
        const events = eventsBySubmission.get(event.submission_id) ?? [];
        events.push(event);
        eventsBySubmission.set(event.submission_id, events);
      }
      return submissions.map((submission) => ({ ...submission, events: eventsBySubmission.get(submission.id) ?? [] }));
    },
  });
}
