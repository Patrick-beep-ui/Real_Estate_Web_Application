import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { DATABASE_URL } from "@/lib/shared/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaClient = globalForPrisma.prisma;

function createPrismaClient(): PrismaClient {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = createPrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClient;
    }
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
