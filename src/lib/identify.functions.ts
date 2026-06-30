import { createServerFn } from "@tanstack/react-start";
import type { IdentificationResult } from "./types";

interface IdentifyInput {
  image: string; // data URL (image/*;base64)
  hint?: string;
}

const SYSTEM_PROMPT = `You are Scany, an elite multi-domain identification engine combining the expertise of botanists, zoologists, ichthyologists, mycologists, ornithologists, entomologists, geologists and nutritionists.

You receive ONE image and must identify its main subject. The subject can belong to ANY of these categories:
plant, flower, tree, fruit, vegetable, seed, animal, bird, insect, fish, fungi (mushroom), food, mineral, object (natural object), or unknown.

Return ONLY a valid JSON object (no markdown, no prose) with EXACTLY this shape:
{
  "category": "<one of the categories above>",
  "commonName": "<common name in English>",
  "scientificName": "<scientific / latin name, or '' if not applicable e.g. for prepared food>",
  "confidence": <integer 0-100>,
  "summary": "<2-3 sentence engaging overview>",
  "badges": [ { "label": "<short>", "tone": "neutral|success|warning|danger" } ],
  "sections": [ { "title": "<section title>", "items": [ { "label": "<field>", "value": "<value>" } ] } ],
  "similar": [ { "commonName": "...", "scientificName": "...", "confidence": <int>, "distinction": "<how to tell apart>" } ],
  "funFact": "<one surprising fact>"
}

CATEGORY-SPECIFIC SECTIONS — populate richly and accurately:
- plant/flower/tree/fruit/vegetable/seed: "Identity" (Common name, Scientific name, Botanical family, Origin), "Care" (Difficulty, Water needs, Sunlight, Ideal temperature, Care tips), "Health" (Toxicity, Common diseases, Pests, Symptoms, Treatments).
- animal: "Identity" (Classification, Scientific name), "Biology" (Habitat, Diet, Size, Weight, Lifespan, Reproduction), "Behavior" (Behavior, Predators, Danger level, Conservation status), "Did you know" (Anecdotes).
- bird/insect: same structure as animal, adapted.
- fish: "Aquatics" (Freshwater or saltwater, Adult size, Ideal temperature, Diet, Aquarium compatibility, Difficulty), "Biology" (Reproduction, Habitat, Common diseases).
- fungi: "Safety" (Edible or toxic, Toxicity level), "Field guide" (Habitat, Season, Look-alike species, Safety advice).
- food: "Overview" (Name, Category), "Nutrition (per 100g)" (Calories, Protein, Fat, Carbs, Fiber, Vitamins, Minerals, Glycemic index), "Health" (Benefits, Risks, Allergens), "Use" (Consumption tips, Recommended recipes).
- mineral/object: "Identity" and "Properties" with relevant fields.

RULES:
- Always include a "badges" entry for safety where relevant: edibility (success/danger), toxicity (danger/warning), conservation status (warning), danger level (danger/warning).
- Provide 2-4 plausible "similar" look-alike species with a clear distinction (empty array only if truly none).
- Be scientifically accurate and concise. Never invent a confidence above what the image supports.
- Everything in English.
- If you cannot identify the subject at all, set category "unknown", confidence low, and explain in summary.`;

function safeJson(text: string): IdentificationResult {
  let t = text.trim();
  // strip markdown fences if present
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  const parsed = JSON.parse(t) as Partial<IdentificationResult>;
  return {
    category: parsed.category ?? "unknown",
    commonName: parsed.commonName ?? "Unknown",
    scientificName: parsed.scientificName ?? "",
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0))),
    summary: parsed.summary ?? "",
    badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    similar: Array.isArray(parsed.similar) ? parsed.similar : [],
    funFact: parsed.funFact,
  };
}

export const identify = createServerFn({ method: "POST" })
  .inputValidator((data: IdentifyInput) => {
    if (!data || typeof data.image !== "string" || !data.image.startsWith("data:image")) {
      throw new Error("A valid image is required.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<IdentificationResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const userText = data.hint
      ? `Identify the main subject. The user thinks it may be a ${data.hint}. Confirm or correct.`
      : "Identify the main subject of this image with full detail.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) {
      throw new Error("Too many requests right now. Please wait a moment and try again.");
    }
    if (res.status === 402) {
      throw new Error("AI credits are exhausted. Please add credits to continue scanning.");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Identification failed (${res.status}). ${body.slice(0, 180)}`);
    }

    const json = await res.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response. Please try another photo.");

    try {
      return safeJson(content);
    } catch {
      throw new Error("Could not read the identification result. Please try a clearer photo.");
    }
  });
