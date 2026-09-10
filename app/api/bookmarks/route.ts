import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks, categories } from "@/lib/db/schema";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions = [];

    if (search) {
      const s = `%${search}%`;
      conditions.push(
        or(
          like(bookmarks.text, s),
          like(bookmarks.authorName, s),
          like(bookmarks.authorHandle, s),
          like(bookmarks.summary, s),
          like(bookmarks.tags, s),
          like(bookmarks.visionText, s)
        )
      );
    }

    if (categoryId && categoryId !== "all") {
      conditions.push(eq(bookmarks.categoryId, categoryId));
    }

    if (tag) {
      conditions.push(like(bookmarks.tags, `%"${tag}"%`));
    }

    if (status && status !== "all") {
      conditions.push(eq(bookmarks.aiStatus, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: bookmarks.id,
        tweetId: bookmarks.tweetId,
        text: bookmarks.text,
        authorName: bookmarks.authorName,
        authorHandle: bookmarks.authorHandle,
        authorAvatar: bookmarks.authorAvatar,
        tweetUrl: bookmarks.tweetUrl,
        createdAt: bookmarks.createdAt,
        importedAt: bookmarks.importedAt,
        media: bookmarks.media,
        summary: bookmarks.summary,
        tags: bookmarks.tags,
        categoryId: bookmarks.categoryId,
        visionText: bookmarks.visionText,
        aiStatus: bookmarks.aiStatus,
        aiError: bookmarks.aiError,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(bookmarks)
      .leftJoin(categories, eq(bookmarks.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(bookmarks.importedAt))
      .limit(limit)
      .offset(offset);

    // Count total matching
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return NextResponse.json({ bookmarks: rows, total });
  } catch (err) {
    console.error("[api/bookmarks] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    if (all) {
      await db.delete(bookmarks);
      return NextResponse.json({ success: true, message: "All bookmarks deleted" });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing bookmark ID" }, { status: 400 });
    }

    await db.delete(bookmarks).where(eq(bookmarks.id, id));
    return NextResponse.json({ success: true, message: "Bookmark deleted" });
  } catch (err) {
    console.error("[api/bookmarks] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}