/// <reference types="jest" />

describe("Prisma client initialization", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  afterEach(() => {
    jest.dontMock("@/generated/prisma/client");
    jest.dontMock("@prisma/adapter-pg");
    jest.dontMock("@/lib/shared/env");
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  function mockPrismaDependencies(databaseUrl: string) {
    const lead = {};
    const PrismaClient = jest.fn().mockImplementation(() => ({ lead }));
    const PrismaPg = jest.fn().mockImplementation(() => ({}));

    jest.doMock("@/generated/prisma/client", () => ({ PrismaClient }));
    jest.doMock("@prisma/adapter-pg", () => ({ PrismaPg }));
    jest.doMock("@/lib/shared/env", () => ({ DATABASE_URL: databaseUrl }));

    return { lead, PrismaClient, PrismaPg };
  }

  it("does not require DATABASE_URL when the module is imported", () => {
    const { PrismaClient, PrismaPg } = mockPrismaDependencies("");
    let prisma!: { lead: unknown };

    jest.isolateModules(() => {
      ({ prisma } = jest.requireActual("@/server/db/prisma"));
    });

    expect(PrismaClient).not.toHaveBeenCalled();
    expect(PrismaPg).not.toHaveBeenCalled();
    expect(() => prisma.lead).toThrow("DATABASE_URL is not configured");
  });

  it("creates and reuses the client on first database access", () => {
    const { lead, PrismaClient, PrismaPg } = mockPrismaDependencies("postgresql://localhost/test");
    let prisma!: { lead: unknown };

    jest.isolateModules(() => {
      ({ prisma } = jest.requireActual("@/server/db/prisma"));
    });

    expect(PrismaClient).not.toHaveBeenCalled();
    expect(prisma.lead).toBe(lead);
    expect(prisma.lead).toBe(lead);
    expect(PrismaPg).toHaveBeenCalledTimes(1);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
