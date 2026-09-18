import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: [".env.local", ".env"] });

const databaseUrl =
  process.env.TESTING_DIRECT_URL ??
  process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error("A Prisma direct database URL is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});