import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { listLeads } from "@/server/modules/leads/leads.repository";

export const GET = withAdmin(async () => okResponse({ items: await listLeads() }));