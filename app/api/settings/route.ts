import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings, categories, bookmarks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const settingsRows = await db.select().from(settings);
    const config = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

    const allCategories = await db.select().from(categories);

    // Calculate bookmark stats
    const totalCount = await db.select({ count: sql<number>`count(*)` }).from(bookmarks);
    const successCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.aiStatus, "success"));
    const failedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.aiStatus, "failed"));
    const pendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.aiStatus, "pending"));

    return NextResponse.json({
      settings: config,
      categories: allCategories,
      stats: {
        total: totalCount[0]?.count || 0,
        success: successCount[0]?.count || 0,
        failed: failedCount[0]?.count || 0,
        pending: pendingCount[0]?.count || 0,
      },
    });
  } catch (err) {
    console.error("[api/settings] GET error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await db
          .insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value },
          });
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (err) {
    console.error("[api/settings] POST error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, category } = body;

    if (action === "create") {
      await db.insert(categories).values({
        id: category.id.toLowerCase().trim().replace(/\s+/g, "-"),
        name: category.name.trim(),
        color: category.color || "#6366f1",
        description: category.description || "",
      });
      return NextResponse.json({ success: true, message: "Category created" });
    }

    if (action === "update") {
      await db
        .update(categories)
        .set({
          name: category.name,
          color: category.color,
          description: category.description,
        })
        .where(eq(categories.id, category.id));
      return NextResponse.json({ success: true, message: "Category updated" });
    }

    if (action === "delete") {
      await db.delete(categories).where(eq(categories.id, category.id));
      return NextResponse.json({ success: true, message: "Category deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[api/settings] PUT error:", err);
    return NextResponse.json({ error: "Failed to modify category" }, { status: 500 });
  }
}