import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type GenerateCaptionBody = {
  propertyAddress?: string;
  beds?: string | number;
  baths?: string | number;
  squareFootage?: string | number;
  price?: string;
  city?: string;
  highlights?: string;
  numPhotos?: number;
  language?: "en" | "vi";
  trendingQuotes?: boolean;
};

export type GenerateCaptionResponse = {
  caption: string;
  hashtags: string[];
  cta: string;
  fullText?: string;
};

function buildPrompt(input: GenerateCaptionBody): string {
  const lang = input.language === "vi" ? "vi" : "en";
  const useTrending = input.trendingQuotes === true;

  const langInstruction =
    lang === "vi"
      ? "Write the entire caption in Vietnamese (Tiếng Việt). Use natural, professional Vietnamese suitable for social media."
      : "Write the caption in English.";

  const toneInstruction = useTrending
    ? "Use a trending, shareable tone. Include a short memorable quote or phrase that works well on social media (e.g. a one-line hook or lifestyle line). Keep it authentic and not cheesy."
    : "Use a professional but engaging tone suitable for Facebook and Instagram.";

  const parts: string[] = [
    "Write a luxury real estate social media caption for a property listing.",
    langInstruction,
    toneInstruction,
    "Include a short marketing description (2–4 sentences), a single call-to-action sentence, and 6–10 relevant real estate hashtags on a separate line.",
    "Avoid exaggerated claims or misleading language.",
    "",
    "Property details (use only what is provided):",
  ];
  if (input.propertyAddress) parts.push(`- Address: ${input.propertyAddress}`);
  if (input.city) parts.push(`- City: ${input.city}`);
  if (input.beds != null && input.beds !== "") parts.push(`- Bedrooms: ${input.beds}`);
  if (input.baths != null && input.baths !== "") parts.push(`- Bathrooms: ${input.baths}`);
  if (input.squareFootage != null && input.squareFootage !== "") parts.push(`- Square footage: ${input.squareFootage}`);
  if (input.price) parts.push(`- Price: ${input.price}`);
  if (input.highlights) parts.push(`- Highlights: ${input.highlights}`);
  if (input.numPhotos != null) parts.push(`- Number of photos in the post: ${input.numPhotos}`);
  parts.push("");
  parts.push("Respond in this exact JSON format only, no other text:");
  parts.push('{"caption":"...","hashtags":["#tag1","#tag2",...],"cta":"..."}');
  return parts.join("\n");
}

function parseResponse(text: string): GenerateCaptionResponse {
  let trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) trimmed = codeBlock[1].trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const str = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(str) as { caption?: string; hashtags?: string[]; cta?: string };
  const caption = typeof parsed.caption === "string" ? parsed.caption : "";
  const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  const cta = typeof parsed.cta === "string" ? parsed.cta : "";
  const fullText = [caption, cta, hashtags.join(" ")].filter(Boolean).join("\n\n");
  return { caption, hashtags, cta, fullText };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to .env.local and restart the dev server. Get a key: https://aistudio.google.com/apikey" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as GenerateCaptionBody;
    const prompt = buildPrompt(body);

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelIds = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
    let lastErr: Error | null = null;
    for (const modelId of modelIds) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        if (!text) {
          lastErr = new Error("No caption generated");
          continue;
        }
        const data = parseResponse(text);
        return NextResponse.json(data);
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (String(lastErr.message).includes("404") || String(lastErr.message).includes("not found")) continue;
        throw e;
      }
    }
    throw lastErr ?? new Error("No caption generated");
  } catch (err) {
    console.error("generate-social-caption error:", err);
    const rawMessage = err instanceof Error ? err.message : String(err);
    if (rawMessage.includes("429") || rawMessage.includes("Too Many Requests") || rawMessage.includes("quota") || rawMessage.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          error: "Rate limit reached. The free tier has a daily and per-minute limit. Please try again in a minute, or check your usage at https://ai.dev/rate-limit",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: rawMessage || "Failed to generate caption" },
      { status: 500 }
    );
  }
}
