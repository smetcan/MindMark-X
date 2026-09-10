import { CategoryInfo, BookmarkAnalysisOutput } from "./types";

const GENERIC_TAGS = new Set([
  "twitter",
  "tweet",
  "post",
  "bookmark",
  "content",
  "social media",
  "x",
  "link",
  "url",
  "screenshot",
  "thread",
]);

export function cleanRawOutput(text: string): string {
  if (!text) return "";

  // 1. Remove <think>...</think> reasoning blocks from DeepSeek-R1 etc.
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").replace(/```/g, "").trim();

  // 3. Extract JSON object substring
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

export function parseAndResolveAnalysis(
  rawText: string,
  categories: CategoryInfo[],
  fallbackText: string = ""
): BookmarkAnalysisOutput {
  const cleaned = cleanRawOutput(rawText);

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.warn("[sanitizer] Failed to parse JSON, attempting loose extract:", err);
  }

  // Raw fields from model output
  const rawCatId = String(parsed.category_id || parsed.categoryId || parsed.category || "").trim();
  const rawCatName = String(parsed.category_name || parsed.categoryName || "").trim();
  const rawSummary = String(parsed.summary || parsed.description || "").trim();
  const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
  const rawConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.85;

  // Resolve Category (Dual-Key Matching)
  const categoryBySlug = new Map(categories.map((c) => [c.id.toLowerCase(), c]));
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  let matchedCategory: CategoryInfo | undefined;

  // 1. Exact or lowercase slug match
  if (rawCatId && categoryBySlug.has(rawCatId.toLowerCase())) {
    matchedCategory = categoryBySlug.get(rawCatId.toLowerCase());
  }
  // 2. Check if rawCatId was actually a category name (DeepSeek tendency)
  else if (rawCatId && categoryByName.has(rawCatId.toLowerCase())) {
    matchedCategory = categoryByName.get(rawCatId.toLowerCase());
  }
  // 3. Check rawCatName against category name
  else if (rawCatName && categoryByName.has(rawCatName.toLowerCase())) {
    matchedCategory = categoryByName.get(rawCatName.toLowerCase());
  }
  // 4. Check rawCatName against category slug
  else if (rawCatName && categoryBySlug.has(rawCatName.toLowerCase())) {
    matchedCategory = categoryBySlug.get(rawCatName.toLowerCase());
  }
  // 5. Partial / fuzzy contains check
  else if (rawCatId || rawCatName) {
    const candidate = (rawCatId + " " + rawCatName).toLowerCase();
    matchedCategory = categories.find(
      (c) => candidate.includes(c.id.toLowerCase()) || candidate.includes(c.name.toLowerCase())
    );
  }

  // 6. Fallback to 'general' or first category
  if (!matchedCategory) {
    matchedCategory = categories.find((c) => c.id === "general") || categories[0] || {
      id: "general",
      name: "Genel",
      description: "Genel içerikler",
    };
  }

  // Clean Tags
  const cleanedTags: string[] = [];
  const seenTags = new Set<string>();

  for (const t of rawTags) {
    if (typeof t !== "string") continue;
    let tag = t.trim().toLowerCase().replace(/^#+/, ""); // strip leading #
    if (!tag || tag.length > 35 || GENERIC_TAGS.has(tag)) continue;
    if (!seenTags.has(tag)) {
      seenTags.add(tag);
      cleanedTags.push(tag);
    }
    if (cleanedTags.length >= 8) break; // Keep top 8 concise tags
  }

  // Summary
  const summary = rawSummary || (fallbackText.slice(0, 150) + (fallbackText.length > 150 ? "..." : ""));

  return {
    categoryId: matchedCategory.id,
    categoryName: matchedCategory.name,
    confidence: Math.min(1, Math.max(0.1, rawConfidence)),
    summary,
    tags: cleanedTags,
  };
}