/// <reference types="jest" />

const leadMock = {
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("@/server/db/prisma", () => ({
  prisma: {
    lead: leadMock,
    $transaction: jest.fn((calls: unknown[]) => Promise.resolve(calls)),
  },
}));

import { prisma } from "@/server/db/prisma";
import type { LeadStatus, PipelineStage } from "@/generated/prisma/client";
import {
  batchUpdatePipelineStages,
  deleteLead,
  listLeads,
  mapLeadRow,
  parseLeadPatch,
  updateLead,
  type AdminLead,
} from "@/server/modules/leads/leads.repository";

const baseRow = {
  id: "lead-1",
  name: "Jane Smith",
  phone: "+15551234567",
  email: "jane@example.com",
  marketSlug: "tampa",
  situationSlug: "divorce",
  source: "homepage",
  utmSource: "adwords",
  utmMedium: null,
  utmCampaign: null,
  status: "new" as LeadStatus,
  createdAt: new Date("2026-09-30T12:00:00.000Z"),
  updatedAt: new Date("2026-09-30T12:00:00.000Z"),
  propertyAddress: "123 Main St, Tampa, FL 33612",
  notes: "some notes",
  pipelineStage: "offer_made" as PipelineStage,
  // A real Prisma Decimal is string-convertible; mimic that so Number() yields 250000.
  offerAmount: { toString: () => "250000", valueOf: () => 250000 },
  gclid: "gclid-1",
  fbclid: null,
  msclkid: null,
  pagePath: "/divorce/tampa",
  utmContent: null,
  utmTerm: null,
  utmId: null,
  fbAdsetId: null,
  fbCampaignId: null,
  timelineToSell: "1-3 months",
  listedWithAgent: "no",
  propertyAge: "30+ years",
  tzBrowser: "America/New_York",
  tzIp: "America/Chicago",
  addressVerified: true,
  addressSource: "google",
  gbraid: null,
  wbraid: null,
  sellerState: "FL",
  sellerCountry: "CA",
};

describe("Lead admin repository", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    leadMock.findMany.mockImplementation(async () => []);
    leadMock.update.mockImplementation(async () => baseRow);
    leadMock.delete.mockImplementation(async () => baseRow);
    (prisma.$transaction as jest.Mock).mockImplementation(async (calls: unknown[]) => calls);
  });

  it("maps a Prisma row to the snake_case AdminLead DTO", () => {
    const dto = mapLeadRow(baseRow as unknown as Parameters<typeof mapLeadRow>[0]);
    expect(dto).toMatchObject({
      id: "lead-1",
      name: "Jane Smith",
      phone: "+15551234567",
      email: "jane@example.com",
      property_address: "123 Main St, Tampa, FL 33612",
      offer_amount: 250000,
      pipeline_stage: "offer_made",
      status: "new",
      market_slug: "tampa",
      situation_slug: "divorce",
      source: "homepage",
      seller_state: "FL",
      seller_country: "CA",
    });
    expect(dto.created_at).toBe("2026-09-30T12:00:00.000Z");
  });

  it("listLeads reads all leads ordered by created_at desc", async () => {
    leadMock.findMany.mockResolvedValue([baseRow]);
    const items = await listLeads();
    expect(leadMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "lead-1", offer_amount: 250000 });
  });

  it("updateLead applies allowed fields and stamps updatedAt", async () => {
    leadMock.update.mockResolvedValue(baseRow);
    const result = await updateLead(
      "lead-1",
      parseLeadPatch({ offer_amount: 120000, notes: "updated", pipeline_stage: "under_contract" }),
    );
    const call = leadMock.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "lead-1" });
    expect(call.data).toMatchObject({
      offerAmount: 120000,
      notes: "updated",
      pipelineStage: "under_contract",
    });
    expect(call.data).toHaveProperty("updatedAt");
    expect(result).toMatchObject({ id: "lead-1" });
  });

  it("parseLeadPatch rejects unknown keys before any Prisma write", () => {
    expect(() => parseLeadPatch({ phone: "+1999" })).toThrow(/Unknown field/);
    expect(leadMock.update).not.toHaveBeenCalled();
  });

  it("parseLeadPatch rejects invalid pipeline_stage values", () => {
    expect(() => parseLeadPatch({ pipeline_stage: "not_a_stage" })).toThrow(/Invalid pipeline_stage/);
    expect(() => parseLeadPatch({ status: "not_a_status" })).toThrow(/Invalid status/);
  });

  it("parseLeadPatch rejects non-object bodies and invalid value types", () => {
    expect(() => parseLeadPatch(null)).toThrow(/Invalid request body/);
    expect(() => parseLeadPatch([])).toThrow(/Invalid request body/);
    expect(() => parseLeadPatch({ offer_amount: "120000" })).toThrow(/offer_amount/);
    expect(() => parseLeadPatch({ notes: 42 })).toThrow(/notes/);
  });

  it("updateLead maps missing row errors to 404", async () => {
    leadMock.update.mockImplementation(async () => {
      throw Object.assign(new Error("missing"), { code: "P2025" });
    });
    await expect(updateLead("lead-x", parseLeadPatch({ notes: "hi" }))).rejects.toMatchObject({ status: 404 });
  });

  it("batchUpdatePipelineStages runs a transaction with derived statuses", async () => {
    // Echo back the update argument so the repository's transaction payload is inspectable.
    leadMock.update.mockImplementation(async (arg: unknown) => arg);
    (prisma.$transaction as jest.Mock).mockImplementation(async (calls: unknown[]) => calls);

    const result = await batchUpdatePipelineStages({ "lead-1": "contacted", "lead-2": "closed" });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(leadMock.update).toHaveBeenCalledTimes(2);

    const byId = Object.fromEntries(
      leadMock.update.mock.calls.map(([arg]: [{ where: { id: string }; data: Record<string, unknown> }]) => [
        arg.where.id,
        arg.data,
      ]),
    );
    expect(leadMock.update.mock.calls[0][0].where).toEqual({ id: "lead-1" });
    expect(byId["lead-1"]).toMatchObject({ pipelineStage: "contacted", status: "contacted" });
    expect(byId["lead-2"]).toMatchObject({ pipelineStage: "closed", status: "closed" });
    expect(byId["lead-1"]).toHaveProperty("updatedAt");
    expect(result).toEqual({ ok: true, count: 2 });
  });

  it("batchUpdatePipelineStages rejects invalid stages and empty changes", async () => {
    await expect(batchUpdatePipelineStages({ "lead-1": "bogus" })).rejects.toMatchObject({ status: 400 });
    await expect(batchUpdatePipelineStages({})).rejects.toMatchObject({ status: 400 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deleteLead deletes the matching row", async () => {
    leadMock.delete.mockResolvedValue(baseRow);
    await deleteLead("lead-1");
    expect(leadMock.delete).toHaveBeenCalledWith({ where: { id: "lead-1" } });
  });

  it("deleteLead maps missing row errors to 404", async () => {
    leadMock.delete.mockImplementation(async () => {
      throw Object.assign(new Error("missing"), { code: "P2025" });
    });
    await expect(deleteLead("lead-x")).rejects.toMatchObject({ status: 404 });
  });

  it("AdminLead type is a plain serializable object shape", () => {
    const dto: AdminLead = mapLeadRow(baseRow as unknown as Parameters<typeof mapLeadRow>[0]);
    expect(JSON.parse(JSON.stringify(dto))).toMatchObject({
      id: "lead-1",
      created_at: "2026-09-30T12:00:00.000Z",
      offer_amount: 250000,
    });
  });
});