// Health-check endpoint polled by the Docker/compose HEALTHCHECK.
import { NextResponse } from "next/server";

// force-dynamic: the timestamp must never be statically cached at build time
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
