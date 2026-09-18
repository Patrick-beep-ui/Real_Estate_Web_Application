-- attribution_clicks: captures click-to-call and click-to-SMS events with Meta/Google
-- ad attribution data, later matched against inbound GHL contacts by phone + timestamp.
--
-- Applied manually via Supabase Studio SQL Editor. This file exists in the repo as
-- documentation of the schema — not as a live migration.
--
-- Related endpoints:
--   POST /api/attribution/click  - stores a click record
--   POST /api/attribution/match  - matches inbound GHL contact to a pending click

create table public.attribution_clicks (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('call', 'sms')),
  target_phone text,
  fbc text,
  fbp text,
  fbclid text,
  gclid text,
  msclkid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  utm_id text,
  fb_adset_id text,
  fb_campaign_id text,
  page_path text,
  user_agent text,
  client_ip text,
  clicked_at timestamptz not null default now(),
  consumed_at timestamptz,
  consumed_by_contact_id text,
  created_at timestamptz not null default now()
);

-- Partial index for the matching query: finds unconsumed clicks by channel,
-- ordered by recency. Stays small even as historical data grows.
create index idx_attribution_clicks_pending_by_channel
  on public.attribution_clicks (channel, clicked_at desc)
  where consumed_at is null;

-- Index for cleanup jobs (delete old rows).
create index idx_attribution_clicks_created_at
  on public.attribution_clicks (created_at);

comment on table public.attribution_clicks is 'Click-to-call and click-to-SMS attribution captures. Matched to inbound GHL contacts by phone + timestamp within 60 min.';
comment on column public.attribution_clicks.channel is 'call or sms — which button was clicked';
comment on column public.attribution_clicks.target_phone is 'The site phone number the user clicked (not the caller phone)';
comment on column public.attribution_clicks.fbc is 'Facebook click ID cookie value, format: fb.1.{timestamp}.{fbclid}';
comment on column public.attribution_clicks.fbp is 'Facebook browser ID cookie value';
comment on column public.attribution_clicks.consumed_at is 'Timestamp when this click was matched to a GHL contact';
comment on column public.attribution_clicks.consumed_by_contact_id is 'GHL contact ID that consumed this click';
comment on column public.attribution_clicks.utm_id is 'Meta Ads dynamic URL param utm_id={{ad.id}} — ad ID';
comment on column public.attribution_clicks.fb_adset_id is 'Meta Ads dynamic URL param fb_adset_id={{adset.id}} — ad set ID';
comment on column public.attribution_clicks.fb_campaign_id is 'Meta Ads dynamic URL param fb_campaign_id={{campaign.id}} — campaign ID';