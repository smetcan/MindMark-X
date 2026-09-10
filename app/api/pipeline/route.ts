import { NextRequest, NextResponse } from "next/server";
import { getPipelineStatus, startPipeline, stopPipeline } from "@/lib/ai/pipeline";

export async function GET() {
  try {
    const status = getPipelineStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { forceAll, bookmarkIds } = body;

    const result = await startPipeline({ forceAll, bookmarkIds });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/pipeline] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start pipeline" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    stopPipeline();
    return NextResponse.json({ success: true, message: "Pipeline stop requested." });
  } catch (err) {
    return NextResponse.json({ error: "Failed to stop pipeline" }, { status: 500 });
  }
}