import { NewBookmark } from "../db/schema";
import crypto from "crypto";

export function parseTweetData(rawInput: unknown): NewBookmark[] {
  let items: unknown[] = [];

  if (Array.isArray(rawInput)) {
    items = rawInput;
  } else if (typeof rawInput === "object" && rawInput !== null) {
    const obj = rawInput as Record<string, unknown>;
    // Check for common wrappers like { bookmarks: [...] } or { data: [...] }
    if (Array.isArray(obj.bookmarks)) {
      items = obj.bookmarks;
    } else if (Array.isArray(obj.data)) {
      items = obj.data;
    } else if (Array.isArray(obj.tweets)) {
      items = obj.tweets;
    } else {
      items = [obj];
    }
  }

  const normalized: NewBookmark[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, any>;

    // Handle Twitter Archive wrapper: { tweet: { ... } }
    const t = raw.tweet || raw;

    // 1. Tweet ID
    const tweetId = String(
      t.id_str || t.id || t.tweet_id || t.tweetId || t.rest_id || ""
    ).trim();

    if (!tweetId || seenIds.has(tweetId)) continue;
    seenIds.add(tweetId);

    // 2. Tweet Text
    const text = String(
      t.full_text || t.text || t.legacy?.full_text || t.legacy?.text || ""
    ).trim();

    // 3. Author info (Resolving both legacy and new X core schema)
    let authorName = "Unknown";
    let authorHandle = "@unknown";
    let authorAvatar: string | undefined;

    // Check direct fields
    if (t.author_name || t.authorName) {
      authorName = String(t.author_name || t.authorName);
    }
    if (t.author_handle || t.authorHandle) {
      authorHandle = String(t.author_handle || t.authorHandle);
    }
    if (t.author_avatar || t.authorAvatar) {
      authorAvatar = String(t.author_avatar || t.authorAvatar);
    }

    // Check user object or core.user_results
    const userRes = t.core?.user_results?.result || t.user_results?.result || t.user;
    if (userRes) {
      const uLegacy = userRes.legacy || {};
      const uCore = userRes.core || {};

      authorName = String(uCore.name || uLegacy.name || userRes.name || authorName);
      const screenName = String(
        uCore.screen_name || uLegacy.screen_name || userRes.screen_name || ""
      );
      if (screenName) {
        authorHandle = screenName.startsWith("@") ? screenName : `@${screenName}`;
      }

      authorAvatar =
        userRes.avatar?.image_url ||
        uLegacy.profile_image_url_https ||
        userRes.profile_image_url_https ||
        authorAvatar;
    }

    // 4. Tweet URL
    const cleanHandle = authorHandle.replace(/^@/, "");
    const tweetUrl = String(
      t.url ||
      t.tweet_url ||
      t.tweetUrl ||
      (cleanHandle && tweetId ? `https://x.com/${cleanHandle}/status/${tweetId}` : `https://x.com/i/status/${tweetId}`)
    );

    // 5. Media extraction
    const mediaList: { type: string; url: string }[] = [];

    // Check direct media array
    if (Array.isArray(t.media)) {
      for (const m of t.media) {
        if (typeof m === "string") {
          mediaList.push({ type: "photo", url: m });
        } else if (m && typeof m === "object") {
          mediaList.push({
            type: m.type || "photo",
            url: m.url || m.media_url_https || "",
          });
        }
      }
    } else {
      // Check legacy entities.media or extended_entities.media
      const entitiesMedia = t.extended_entities?.media || t.legacy?.extended_entities?.media || t.entities?.media || [];
      if (Array.isArray(entitiesMedia)) {
        for (const m of entitiesMedia) {
          mediaList.push({
            type: m.type || "photo",
            url: m.media_url_https || m.url || "",
          });
        }
      }
    }

    // 6. Created date
    let createdAt: Date | undefined;
    const dateRaw = t.created_at || t.createdAt || t.legacy?.created_at;
    if (dateRaw) {
      const d = new Date(dateRaw);
      if (!isNaN(d.getTime())) createdAt = d;
    }

    normalized.push({
      id: crypto.randomUUID(),
      tweetId,
      text: text || "Media / Link Bookmark",
      authorName,
      authorHandle,
      authorAvatar: authorAvatar || null,
      tweetUrl,
      createdAt: createdAt || new Date(),
      importedAt: new Date(),
      media: mediaList.length > 0 ? JSON.stringify(mediaList) : null,
      summary: null,
      tags: null,
      categoryId: null,
      visionText: null,
      aiStatus: "pending",
      aiError: null,
    });
  }

  return normalized;
}