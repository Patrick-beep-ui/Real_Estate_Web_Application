import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: [".env.local", ".env"] });

const command = process.argv[2];
const databaseUrl =
  process.env.TESTING_DIRECT_URL ??
  process.env.DIRECT_URL;

const needsDatabaseUrl = command === "db" || command === "migrate" || command === "studio";

if (needsDatabaseUrl && !databaseUrl) {
  throw new Error("A Prisma direct database URL is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: databaseUrl ? { url: databaseUrl } : {},
});