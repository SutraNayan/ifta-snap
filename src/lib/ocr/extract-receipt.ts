import Anthropic from "@anthropic-ai/sdk";
import { ExtractedReceiptData } from "@/types/fuel-log";
import {
  RECEIPT_EXTRACTION_SYSTEM_PROMPT,
  RECEIPT_EXTRACTION_USER_PROMPT,
} from "./receipt-prompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractReceiptData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractedReceiptData> {
  const response = await client.messages.create({
    // claude-sonnet-4-5-20250929: pinned version for reproducible OCR results.
    // Vision-capable; best balance of accuracy and cost for IFTA receipt extraction.
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: RECEIPT_EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: RECEIPT_EXTRACTION_USER_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Vision API");
  }

  let parsed: ExtractedReceiptData;
  try {
    // Strip any accidental markdown code fences
    const clean = textBlock.text.replace(/```json?|```/g, "").trim();
    parsed = JSON.parse(clean) as ExtractedReceiptData;
  } catch {
    throw new Error(`Failed to parse Vision API response: ${textBlock.text}`);
  }

  // Enforce numeric precision
  parsed.gallons = Number(parsed.gallons.toFixed(3));
  parsed.price_per_gallon = Number(parsed.price_per_gallon.toFixed(3));
  parsed.total_price = Number(parsed.total_price.toFixed(2));

  return parsed;
}
