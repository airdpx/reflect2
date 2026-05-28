import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userState.deleteMany();
  await prisma.user.deleteMany();
  console.log("Auth tables wiped clean.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
