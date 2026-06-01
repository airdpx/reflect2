import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { getPrisma } from "../../../../src/server/db";

type ExportFormat = "json" | "sql";

export async function GET(request: Request) {
  try {
    await requireCurrentAdmin();
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "json") as ExportFormat;
    const prisma = getPrisma();
    const users = await prisma.user.findMany({ orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }], include: { state: true } });
    if (format === "sql") {
      const sql = buildSqlDump(users);
      return new NextResponse(sql, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": 'attachment; filename="reflect2-users.sql"'
        }
      });
    }
    const json = {
      exportedAt: new Date().toISOString(),
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        birthDate: user.birthDate,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        state: user.state?.state || null
      }))
    };
    return NextResponse.json(json, {
      headers: {
        "Content-Disposition": 'attachment; filename="reflect2-users.json"'
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

function buildSqlDump(users: Array<{
  id: string;
  email: string;
  name: string;
  birthDate: string;
  passwordHash: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  state: { state: unknown; createdAt: Date; updatedAt: Date } | null;
}>) {
  const lines = [
    "-- Reflect2 user export",
    `-- exported_at: ${new Date().toISOString()}`,
    ""
  ];
  for (const user of users) {
    lines.push(
      `INSERT INTO "User" ("id","email","name","passwordHash","birthDate","isAdmin","isBlocked","createdAt","updatedAt") VALUES (${sql(user.id)}, ${sql(user.email)}, ${sql(user.name)}, ${sql(user.passwordHash)}, ${sql(user.birthDate)}, ${user.isAdmin}, ${user.isBlocked}, ${sqlDate(user.createdAt)}, ${sqlDate(user.updatedAt)});`
    );
    if (user.state) {
      lines.push(
        `INSERT INTO "UserState" ("id","userId","state","createdAt","updatedAt") VALUES (${sql(`state-${user.id}`)}, ${sql(user.id)}, ${sqlJson(user.state.state)}, ${sqlDate(user.state.createdAt)}, ${sqlDate(user.state.updatedAt)});`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

function sql(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlDate(value: Date) {
  return `TIMESTAMP '${value.toISOString().replace("T", " ").slice(0, 19)}'`;
}

function sqlJson(value: unknown) {
  return `${sql(JSON.stringify(value))}::jsonb`;
}
