import Anthropic from "@anthropic-ai/sdk";
import { BookmarkAnalysisInput, BookmarkAnalysisOutput } from "./types";
import { buildSystemPrompt, buildBookmarkPrompt, buildVisionPrompt } from "./prompts";
import { parseAndResolveAnalysis } from "./sanitizer";

export async function analyzeWithAnthropic(
  input: BookmarkAnalysisInput,
  apiKey: string,
  model: string = "claude-3-5-haiku-20241022"
): Promise<BookmarkAnalysisOutput> {
  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildBookmarkPrompt(input);

  const response = await client.messages.create({
    model: model || "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.2,
  });

  const textBlock = response.content.find((c) => c.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
  return parseAndResolveAnalysis(rawText, input.categories, input.text);
}

export async function extractOcrWithAnthropic(
  imageUrl: string,
  apiKey: string,
  model: string = "claude-3-5-haiku-20241022"
): Promise<string> {
  try {
    const client = new Anthropic({ apiKey });
    const imgRes = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!imgRes.ok) return "";

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = (imgRes.headers.get("content-type") || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await client.messages.create({
      model: model || "claude-3-5-haiku-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: buildVisionPrompt(),
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const textBlock = response.content.find((c) => c.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
  } catch (err) {
    console.warn("[anthropic-ocr] Failed to extract OCR for", imageUrl, err);
    return "";
  }
}
