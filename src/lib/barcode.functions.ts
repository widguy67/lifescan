import { createServerFn } from "@tanstack/react-start";
import type { IdentificationResult } from "./types";

interface BarcodeInput {
  code: string;
}

/** Look up a food product by its barcode using the Open Food Facts database. */
export const lookupBarcode = createServerFn({ method: "POST" })
  .inputValidator((data: BarcodeInput) => {
    if (!data || typeof data.code !== "string" || !/^\d{6,14}$/.test(data.code.trim())) {
      throw new Error("A valid product barcode is required.");
    }
    return { code: data.code.trim() };
  })
  .handler(async ({ data }): Promise<IdentificationResult & { imageUrl?: string }> => {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${data.code}.json?fields=product_name,brands,categories,image_url,nutriscore_grade,nova_group,ingredients_text,allergens_tags,nutriments,quantity,labels`,
      { headers: { "User-Agent": "Scany/1.0 (food scanner)" } },
    );

    if (!res.ok) {
      throw new Error(`Barcode lookup failed (${res.status}). Please try again.`);
    }

    const json = await res.json();
    if (json.status !== 1 || !json.product) {
      throw new Error("This barcode wasn't found in the food database. Try scanning the product photo instead.");
    }

    const p = json.product;
    const n = p.nutriments ?? {};
    const name: string = p.product_name || "Unknown product";
    const brand: string = p.brands || "";

    const num = (v: unknown, unit = "") =>
      typeof v === "number" && !Number.isNaN(v) ? `${Math.round(v * 10) / 10}${unit}` : "—";

    const allergens: string = Array.isArray(p.allergens_tags)
      ? p.allergens_tags.map((a: string) => a.replace(/^en:/, "")).join(", ")
      : "";

    const nutriscore = typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toUpperCase() : "";
    const badges: IdentificationResult["badges"] = [];
    if (nutriscore && nutriscore !== "NOT-APPLICABLE") {
      badges.push({
        label: `Nutri-Score ${nutriscore}`,
        tone: ["A", "B"].includes(nutriscore) ? "success" : nutriscore === "C" ? "neutral" : "warning",
      });
    }
    if (allergens) badges.push({ label: "Contains allergens", tone: "warning" });

    return {
      category: "food",
      commonName: brand ? `${name} (${brand})` : name,
      scientificName: "",
      confidence: 100,
      summary: `${name}${brand ? ` by ${brand}` : ""}${p.quantity ? ` · ${p.quantity}` : ""}. Nutrition facts sourced from the Open Food Facts database.`,
      badges,
      imageUrl: typeof p.image_url === "string" ? p.image_url : undefined,
      sections: [
        {
          title: "Overview",
          items: [
            { label: "Name", value: name },
            { label: "Brand", value: brand || "—" },
            { label: "Category", value: p.categories || "—" },
            { label: "Quantity", value: p.quantity || "—" },
            { label: "Barcode", value: data.code },
          ],
        },
        {
          title: "Nutrition (per 100g)",
          items: [
            { label: "Calories", value: num(n["energy-kcal_100g"], " kcal") },
            { label: "Protein", value: num(n.proteins_100g, " g") },
            { label: "Fat", value: num(n.fat_100g, " g") },
            { label: "Saturated fat", value: num(n["saturated-fat_100g"], " g") },
            { label: "Carbs", value: num(n.carbohydrates_100g, " g") },
            { label: "Sugars", value: num(n.sugars_100g, " g") },
            { label: "Fiber", value: num(n.fiber_100g, " g") },
            { label: "Salt", value: num(n.salt_100g, " g") },
          ],
        },
        {
          title: "Health",
          items: [
            { label: "Nutri-Score", value: nutriscore || "—" },
            { label: "NOVA group", value: p.nova_group ? String(p.nova_group) : "—" },
            { label: "Allergens", value: allergens || "None listed" },
            { label: "Labels", value: p.labels || "—" },
          ],
        },
        {
          title: "Ingredients",
          items: [{ label: "Ingredients", value: p.ingredients_text || "Not available" }],
        },
      ],
      similar: [],
      funFact: undefined,
    };
  });
