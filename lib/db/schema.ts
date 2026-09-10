import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(), // slug: 'dev-tools', 'ai-ml', etc.
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(), // uuid
  tweetId: text("tweet_id").notNull().unique(),
  text: text("text").notNull(),
  authorName: text("author_name").notNull(),
  authorHandle: text("author_handle").notNull(),
  authorAvatar: text("author_avatar"),
  tweetUrl: text("tweet_url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  importedAt: integer("imported_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  media: text("media"), // JSON string: [{ type: 'photo', url: '...' }]
  summary: text("summary"),
  tags: text("tags"), // JSON array: ["react", "frontend"]
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  visionText: text("vision_text"),
  aiStatus: text("ai_status").notNull().default("pending"), // 'pending' | 'processing' | 'success' | 'failed'
  aiError: text("ai_error"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Setting = typeof settings.$inferSelect;
