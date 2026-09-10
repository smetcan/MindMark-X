import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { parseTweetData } from "@/lib/import/parser";
import { startPipeline } from "@/lib/ai/pipeline";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseTweetData(body);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid tweets found in payload" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let imported = 0;
    let skipped = 0;

    // Batch insert with onConflictDoNothing
    const BATCH = 50;
    for (let i = 0; i < parsed.length; i += BATCH) {
      const chunk = parsed.slice(i, i + BATCH);
      const res = await db.insert(bookmarks).values(chunk).onConflictDoNothing({ target: bookmarks.tweetId });
      const insertedCount = res.rowsAffected || 0;
      imported += insertedCount;
      skipped += chunk.length - insertedCount;
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get("autoStart") === "true") {
      void startPipeline().catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        imported,
        skipped,
        total: parsed.length,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("[api/import] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import bookmarks" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}