import { Pool } from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

try {
  await pool.query("BEGIN");
  await pool.query('DELETE FROM "PasswordResetToken"');
  await pool.query('DELETE FROM "Session"');
  await pool.query('DELETE FROM "UserState"');
  await pool.query('DELETE FROM "User"');
  await pool.query("COMMIT");
  console.log("Auth tables wiped clean.");
} catch (error) {
  await pool.query("ROLLBACK").catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
