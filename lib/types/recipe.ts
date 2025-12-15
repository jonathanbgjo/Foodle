export type Recipe = {
  title: string;
  servings?: string | null;
  ingredients: Array<{
    item: string;
    quantity?: string | null;
    unit?: string | null;
    notes?: string | null;
  }>;
  steps: Array<{
    order: number;
    instruction: string;
    timeMinutes?: number | null;
  }>;
  notes?: string[] | null;
  cuisine?: string | null;
  mealType?: string | null;
  tags?: string[] | null;
  source?: {
    url?: string | null;
    platform?: "youtube" | "instagram" | "other" | null;
  } | null;
};
