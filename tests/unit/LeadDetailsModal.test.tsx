/// <reference types="jest" />

import { render, screen } from "@testing-library/react";
import { LeadDetailsModal } from "@/components/admin/leads/LeadDetailsModal";
import type { Lead } from "@/lib/leads/types";

const createLead = (
  seller_state: string | null,
  seller_country: string | null = null,
  source = "hero_form"
): Lead => ({
  id: "lead-1",
  name: "Jane Smith",
  phone: "+15551234567",
  email: null,
  property_address: null,
  address_source: null,
  address_verified: null,
  pipeline_stage: "new",
  status: "new",
  offer_amount: null,
  notes: null,
  market_slug: "tampa",
  situation_slug: "divorce",
  created_at: "2026-09-11T00:00:00.000Z",
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  utm_id: null,
  fb_adset_id: null,
  fb_campaign_id: null,
  gclid: null,
  gbraid: null,
  wbraid: null,
  fbclid: null,
  msclkid: null,
  source,
  page_path: null,
  timeline_to_sell: null,
  listed_with_agent: null,
  property_age: null,
  tz_browser: "America/New_York",
  tz_ip: null,
  seller_state,
  seller_country,
});

const renderModal = (seller_state: string | null, seller_country: string | null = null, source = "hero_form") => render(
  <LeadDetailsModal
    lead={createLead(seller_state, seller_country, source)}
    open
    onOpenChange={jest.fn()}
    onOfferSave={jest.fn()}
    onNotesSave={jest.fn()}
    onDelete={jest.fn()}
    formatDate={(date) => date}
    formatSlug={(slug) => slug}
  />
);

describe("LeadDetailsModal", () => {
  it("shows the detected seller state below timezone", () => {
    renderModal("FL");

    expect(screen.getByText("America/New_York")).toBeTruthy();
    expect(screen.getByText("Seller Location: FL")).toBeTruthy();
  });

  it("omits the seller state when it was not detected", () => {
    renderModal(null);

    expect(screen.queryByText(/Seller Location:/)).toBeNull();
  });

  it("combines state and country for a non-US homepage lead", () => {
    renderModal("Managua Department", "NI", "homepage");

    expect(screen.getByText("Seller Location: Managua Department / Nicaragua")).toBeTruthy();
  });

  it("shows the state alone when the source isn't homepage, even with a country on file", () => {
    renderModal("Managua Department", "NI", "hero_form");

    expect(screen.getByText("Seller Location: Managua Department")).toBeTruthy();
  });
});
