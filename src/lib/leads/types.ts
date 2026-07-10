export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  property_address?: string;
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
  fbclid?: string | null;
  msclkid?: string | null;
}
