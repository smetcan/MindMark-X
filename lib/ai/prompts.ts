import { BookmarkAnalysisInput } from "./types";

export function buildSystemPrompt(): string {
  return `You are an expert personal librarian and knowledge curator analyzing Twitter/X bookmarks.
Your goal is to categorize the bookmark into the single most fitting category, extract 4-8 highly relevant, specific semantic search tags, and provide a crisp 1-2 sentence summary.

CRITICAL LANGUAGE REQUIREMENT (STRICT):
- The "summary" field MUST ALWAYS BE WRITTEN IN TURKISH (TÜRKÇE), regardless of whether the original tweet is in English, Japanese, German, Spanish, or any other language!
- Translate and summarize the core insight, value, or actionable takeaway into natural, clear, high-quality Turkish.
- NEVER write the summary in English even if the tweet text and author are 100% English. Always translate and synthesize in Turkish!

Output MUST strictly be valid JSON matching this schema:
{
  "category_id": "<slug of the chosen category>",
  "category_name": "<exact name of the chosen category>",
  "confidence": 0.95,
  "summary": "<MUTLAKA TÜRKÇE: Kaynak dil ne olursa olsun 1-2 cümlelik akıcı Türkçe özet>",
  "tags": ["specific-tag-1", "tool-name", "concept"]
}

Tag Guidelines:
- Specific beats generic: Use "react-19", "rag", "solana", "tailwind", "figma" rather than "tech", "post", "crypto"
- Lowercase, kebab-case or short phrases
- Include detected tools, frameworks, libraries, protocols, people, or techniques
- Output strictly JSON, no markdown codeblocks, no explanations.`;
}

export function buildBookmarkPrompt(input: BookmarkAnalysisInput): string {
  const catList = input.categories
    .map((c) => `- [${c.id}] "${c.name}": ${c.description}`)
    .join("\n");

  let content = `TWEET AUTHOR: ${input.authorName} (${input.authorHandle})
TWEET URL: ${input.tweetUrl}
TWEET TEXT:
${input.text}`;

  if (input.visionText) {
    content += `\n\nIMAGE / OCR CONTEXT (Extracted from attached screenshots/media):
${input.visionText}`;
  }

  content += `\n\nAVAILABLE CATEGORIES (Select the single best match):
${catList}

DİL KURALI (KESİNLİKLE ZORUNLU):
Tweet metni veya görsel içeriği İngilizce olsa bile, "summary" alanı KESİNLİKLE TÜRKÇE yazılmalıdır. İçeriğin ana fikrini ve sunduğu değeri Türkçe özetle.

Return ONLY the JSON response with keys: category_id, category_name, confidence, summary, tags.`;

  return content;
}

export function buildVisionPrompt(): string {
  return `Perform OCR and visual analysis on this image from a tweet.
Extract any readable code, terminal commands, headlines, charts, text, or main visual subjects.
Be concise and factual. Return only the extracted text/summary.`;
}