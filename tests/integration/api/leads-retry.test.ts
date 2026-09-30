/// <reference types="jest" />

jest.mock("@/server/modules/lead-errors/lead-errors.repository", () => ({
  getLeadErrorById: jest.fn(),
  setRetryBatchId: jest.fn(),
  persistRetryResult: jest.fn(),
}));
jest.mock("@/lib/leads/supabase", () => ({ insertLead: jest.fn() }));
jest.mock("@/lib/leads/ghl", () => ({ syncLeadToGhl: jest.fn() }));
jest.mock("@/lib/tracking/traffic-source", () => ({ getTrafficSourceLabel: jest.fn(() => "Website") }));
jest.mock("@/lib/shared/address", () => ({ validateAddressShape: jest.fn() }));
jest.mock("@/lib/leads/geocode", () => ({
  buildAddressBlockMessage: jest.fn(() => ({ error: "address_not_found", message: "Address needs verification" })),
  geocodeAddress: jest.fn(),
}));
jest.mock("@/lib/shared/env", () => ({
  GHL_API_KEY: "test-key",
  GHL_LOCATION_ID: "test-location",
  GHL_PIPELINE_ID: "test-pipeline",
  GHL_PIPELINE_STAGE_ID: "test-stage",
}));

import { retryLeadError } from "@/server/modules/lead-errors/lead-error-retry.service";
import { getLeadErrorById, persistRetryResult, setRetryBatchId } from "@/server/modules/lead-errors/lead-errors.repository";
import { insertLead } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import { validateAddressShape } from "@/lib/shared/address";
import { geocodeAddress } from "@/lib/leads/geocode";

const retryRecord = {
  id: "error-1",
  retryBatchId: null,
  retryCount: 2,
  name: "Jane Smith",
  phone: "+15551234567",
  email: null,
  marketSlug: "tampa",
  situationSlug: "divorce",
  source: "homepage",
  propertyAddress: "123 Main St, Tampa, FL 33612",
  payload: {
    name: "Jane Smith",
    phone: "+15551234567",
    market_slug: "tampa",
    situation_slug: "divorce",
    source: "homepage",
    property_address: "123 Main St, Tampa, FL 33612",
    seller_state: "FL",
    seller_country: "CA",
    tz_browser: "America/New_York",
    tz_ip: "America/Chicago",
  },
};

describe("Lead Error retry service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getLeadErrorById as jest.Mock).mockResolvedValue(retryRecord);
    (setRetryBatchId as jest.Mock).mockResolvedValue(undefined);
    (persistRetryResult as jest.Mock).mockResolvedValue(undefined);
    (validateAddressShape as jest.Mock).mockReturnValue(true);
    (geocodeAddress as jest.Mock).mockResolvedValue({ ok: true });
    (insertLead as jest.Mock).mockResolvedValue({ success: true, duplicate: false });
    (syncLeadToGhl as jest.Mock).mockResolvedValue({ success: true });
  });

  it("loads the record server-side and retains seller attribution for retry delivery", async () => {
    const result = await retryLeadError("error-1", {});

    expect(getLeadErrorById).toHaveBeenCalledWith("error-1");
    expect(setRetryBatchId).toHaveBeenCalledWith("error-1", expect.any(String));
    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      seller_state: "FL",
      seller_country: "CA",
      tz_browser: "America/New_York",
      tz_ip: "America/Chicago",
    }));
    expect(syncLeadToGhl).toHaveBeenCalledWith(
      expect.objectContaining({ market_slug: "tampa", source: "homepage" }),
      expect.any(Object),
      "Website",
      expect.any(String),
    );
    expect(persistRetryResult).toHaveBeenCalledWith(expect.objectContaining({
      id: "error-1",
      retryCount: 3,
      success: true,
    }));
    expect(result).toMatchObject({ success: true, dbSuccess: true, ghlSuccess: true, retryCount: 3 });
  });

  it("blocks an incomplete retry address before database or GHL work", async () => {
    (validateAddressShape as jest.Mock).mockReturnValue(false);

    await expect(retryLeadError("error-1", {})).rejects.toMatchObject({ status: 422 });
    expect(insertLead).not.toHaveBeenCalled();
    expect(syncLeadToGhl).not.toHaveBeenCalled();
    expect(persistRetryResult).not.toHaveBeenCalled();
  });
});
