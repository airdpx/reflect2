import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma-client/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient | null = null;

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (prismaInstance) return prismaInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  prismaInstance = new PrismaClient({
    adapter: new PrismaPg(pool)
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
  return prismaInstance;
}
