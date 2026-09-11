export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  property_address?: string;
  address_source?: string | null;
  address_override?: boolean | null;
  market_slug: string;
  situation_slug: string;
  source: string;
  page_path?: string;
  consent_transactional?: boolean;
  consent_promotional?: boolean;
  listed_with_agent?: string;
  property_age?: string;
  timeline_to_sell?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  market_price?: number | null;
  lowest_price?: number | null;
  meta_event_id?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  tz_browser?: string | null;
  tz_ip?: string | null;
  seller_state?: string | null;
  seller_country?: string | null;
}

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_address: string | null;
  address_source: string | null;
  address_verified: boolean | null;
  pipeline_stage: string | null;
  status: string | null;
  offer_amount: number | null;
  notes: string | null;
  market_slug: string;
  situation_slug: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  source: string;
  page_path: string | null;
  timeline_to_sell: string | null;
  listed_with_agent: string | null;
  property_age: string | null;
  tz_browser: string | null;
  tz_ip: string | null;
  seller_state: string | null;
};

export const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400", status: "new" },
  { key: "contacted", label: "Contacted", color: "bg-blue-500/20 border-blue-500/40 text-blue-400", status: "contacted" },
  { key: "offer_made", label: "Offer Made", color: "bg-purple-500/20 border-purple-500/40 text-purple-400", status: "qualified" },
  { key: "under_contract", label: "Under Contract", color: "bg-cyan-500/20 border-cyan-500/40 text-cyan-400", status: "qualified" },
  { key: "closed", label: "Closed", color: "bg-green-500/20 border-green-500/40 text-green-400", status: "closed" },
  { key: "lost", label: "Lost", color: "bg-red-500/20 border-red-500/40 text-red-400", status: "lost" },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]["key"];
export type PipelineStageStatus = typeof PIPELINE_STAGES[number]["status"];

export const STAGE_TO_STATUS: Record<PipelineStage, PipelineStageStatus> = {
  new: "new",
  contacted: "contacted",
  offer_made: "qualified",
  under_contract: "qualified",
  closed: "closed",
  lost: "lost",
};
