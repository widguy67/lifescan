export type ScanCategory =
  | "plant"
  | "flower"
  | "tree"
  | "fruit"
  | "vegetable"
  | "seed"
  | "animal"
  | "bird"
  | "insect"
  | "fish"
  | "fungi"
  | "food"
  | "mineral"
  | "object"
  | "unknown";

export interface DetailItem {
  label: string;
  value: string;
}

export interface DetailSection {
  title: string;
  items: DetailItem[];
}

export interface SimilarSpecies {
  commonName: string;
  scientificName: string;
  confidence: number;
  distinction: string;
}

export interface IdentificationResult {
  category: ScanCategory;
  commonName: string;
  scientificName: string;
  confidence: number;
  summary: string;
  /** Optional safety / status badges, e.g. "Edible", "Toxic", "Endangered". */
  badges: { label: string; tone: "neutral" | "success" | "warning" | "danger" }[];
  sections: DetailSection[];
  similar: SimilarSpecies[];
  /** A short, vivid description to render an HD illustration if no photo. */
  funFact?: string;
}

export interface ScanRecord extends IdentificationResult {
  id: string;
  createdAt: number;
  image: string; // data URL
  favorite: boolean;
}

export const CATEGORY_LABELS: Record<ScanCategory, string> = {
  plant: "Plant",
  flower: "Flower",
  tree: "Tree",
  fruit: "Fruit",
  vegetable: "Vegetable",
  seed: "Seed",
  animal: "Animal",
  bird: "Bird",
  insect: "Insect",
  fish: "Fish",
  fungi: "Mushroom",
  food: "Food",
  mineral: "Mineral",
  object: "Natural object",
  unknown: "Result",
};
