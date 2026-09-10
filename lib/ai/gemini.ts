import { GoogleGenAI } from "@google/genai";
import { BookmarkAnalysisInput, BookmarkAnalysisOutput } from "./types";
import { buildSystemPrompt, buildBookmarkPrompt, buildVisionPrompt } from "./prompts";
import { parseAndResolveAnalysis } from "./sanitizer";

export async function analyzeWithGemini(
  input: BookmarkAnalysisInput,
  apiKey: string,
  model: string = "gemini-2.5-flash"
): Promise<BookmarkAnalysisOutput> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildBookmarkPrompt(input);

  const response = await ai.models.generateContent({
    model: model || "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: buildSystemPrompt(),
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const rawText = response.text || "";
  return parseAndResolveAnalysis(rawText, input.categories, input.text);
}

export async function extractOcrWithGemini(
  imageUrl: string,
  apiKey: string,
  model: string = "gemini-2.5-flash"
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const imgRes = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!imgRes.ok) return "";

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        buildVisionPrompt(),
      ],
      config: {
        temperature: 0.1,
      },
    });

    return (response.text || "").trim();
  } catch (err) {
    console.warn("[gemini-ocr] Failed to extract OCR for", imageUrl, err);
    return "";
  }
}