// supabase/functions/_shared/fda-ingredient-list.ts
// Curated subset of the FDA's "Information on Select Dietary Supplement
// Ingredients and Other Substances" list, scraped 2024-Q4 from
// https://www.fda.gov/food/dietary-supplements/information-select-dietary-supplement-ingredients-and-other-substances
//
// FDA category meanings:
//   2 = Safety concerns (consumer advisory issued)
//   3 = Not a dietary ingredient (FDA classifies as drug)
//   4 = Approved drug — unlawful in supplements
//   7 = Adulterated dietary supplement
// Category 1 (qualified health claim) is intentionally NOT included — it's
// informational, not a safety flag.
//
// We pair this static list with a live openFDA Class I recall lookup at
// runtime; the static list is the strong signal, recalls are a secondary one.

export type FdaCategory = 2 | 3 | 4 | 7;
export type FdaSeverity = "critical" | "high" | "medium";

export interface FdaIngredient {
  ingredient: string;        // canonical name, lowercased for matching
  display: string;           // pretty name for the UI
  synonyms: string[];        // lowercased
  category: FdaCategory;
  severity: FdaSeverity;
  fda_url: string;
  reason_short: string;
}

// Generic FDA hub for any ingredient that doesn't have a dedicated page.
const FDA_LIST_URL =
  "https://www.fda.gov/food/dietary-supplements/information-select-dietary-supplement-ingredients-and-other-substances";

export const FDA_INGREDIENTS: FdaIngredient[] = [
  // ------- Category 2: Safety concerns -------
  {
    ingredient: "kratom",
    display: "Kratom",
    synonyms: ["mitragyna speciosa", "mitragynine", "7-hydroxymitragynine"],
    category: 2,
    severity: "high",
    fda_url: "https://www.fda.gov/news-events/public-health-focus/fda-and-kratom",
    reason_short:
      "FDA safety advisory: opioid-like effects, risk of dependence, liver injury, and serious adverse events including death.",
  },
  {
    ingredient: "kava",
    display: "Kava",
    synonyms: ["kava kava", "piper methysticum", "yangona", "kava pepper"],
    category: 2,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA consumer advisory: linked to severe liver injury, including hepatitis and liver failure requiring transplant.",
  },
  {
    ingredient: "ephedra",
    display: "Ephedra / Ephedrine alkaloids",
    synonyms: ["ephedrine", "ma huang", "ephedra sinica", "ephedrine alkaloids"],
    category: 2,
    severity: "critical",
    fda_url:
      "https://www.fda.gov/food/dietary-supplement-products-ingredients/final-rule-declaring-dietary-supplements-containing-ephedrine-alkaloids-adulterated",
    reason_short:
      "Banned by FDA in dietary supplements — unreasonable risk of heart attack, stroke and death.",
  },
  {
    ingredient: "yohimbe",
    display: "Yohimbe",
    synonyms: ["yohimbine", "pausinystalia yohimbe", "yohimbe bark"],
    category: 2,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA flagged: can cause dangerous blood-pressure spikes, heart attack, seizures and renal failure.",
  },
  {
    ingredient: "comfrey",
    display: "Comfrey",
    synonyms: ["symphytum officinale", "pyrrolizidine alkaloids"],
    category: 2,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA advised removal: pyrrolizidine alkaloids cause serious liver damage and are carcinogenic.",
  },
  {
    ingredient: "nerium oleander",
    display: "Nerium oleander / Oleandrin",
    synonyms: ["oleandrin", "oleander"],
    category: 2,
    severity: "critical",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: highly toxic. Cardiac glycosides cause life-threatening heart rhythm disturbances.",
  },
  {
    ingredient: "lgd-4033",
    display: "LGD-4033 (Ligandrol, SARM)",
    synonyms: ["ligandrol", "vk-5211", "anabolicum"],
    category: 2,
    severity: "high",
    fda_url:
      "https://www.fda.gov/consumers/consumer-updates/fda-warns-use-selective-androgen-receptor-modulators-sarms-among-teens-young-adults",
    reason_short:
      "FDA warning: SARM linked to liver toxicity, heart attack, stroke. Not approved for human use.",
  },
  {
    ingredient: "ostarine",
    display: "Ostarine (SARM)",
    synonyms: ["enobosarm", "mk-2866", "gtx-024", "ostabolic"],
    category: 2,
    severity: "high",
    fda_url:
      "https://www.fda.gov/consumers/consumer-updates/fda-warns-use-selective-androgen-receptor-modulators-sarms-among-teens-young-adults",
    reason_short:
      "FDA warning: SARM linked to liver toxicity, heart attack and stroke. Not approved for human use.",
  },

  // ------- Category 3: Drugs improperly sold as supplements -------
  {
    ingredient: "phenibut",
    display: "Phenibut",
    synonyms: ["fenibut", "phenibut hcl", "phenyl-gaba", "4-amino-3-phenylbutyric acid"],
    category: 3,
    severity: "high",
    fda_url:
      "https://www.fda.gov/food/information-select-dietary-supplement-ingredients-and-other-substances/phenibut-dietary-supplements",
    reason_short:
      "FDA: not a lawful dietary ingredient. Drug-like central-nervous-system depressant; risk of dependence and overdose.",
  },
  {
    ingredient: "picamilon",
    display: "Picamilon",
    synonyms: ["pikamilon", "pikatropin", "nicotinoyl-gaba"],
    category: 3,
    severity: "medium",
    fda_url:
      "https://www.fda.gov/food/information-select-dietary-supplement-ingredients-and-other-substances/picamilon-dietary-supplements",
    reason_short:
      "FDA: a drug, not a dietary ingredient. Unlawful in supplements sold in the U.S.",
  },
  {
    ingredient: "methylsynephrine",
    display: "Methylsynephrine (Oxilofrine)",
    synonyms: ["oxilofrine", "p-hydroxyephedrine", "4-hydroxyephedrine"],
    category: 3,
    severity: "high",
    fda_url:
      "https://www.fda.gov/food/information-select-dietary-supplement-ingredients-and-other-substances/methylsynephrine-dietary-supplements",
    reason_short:
      "FDA: a stimulant drug, not a dietary ingredient. Linked to serious cardiac events.",
  },
  {
    ingredient: "higenamine",
    display: "Higenamine",
    synonyms: ["norcoclaurine", "demethylcoclaurine", "higenamine hcl"],
    category: 3,
    severity: "high",
    fda_url:
      "https://www.fda.gov/food/hfp-constituent-updates/fda-sends-warning-letters-multiple-companies-illegally-selling-adulterated-dietary-supplements",
    reason_short:
      "FDA warning letters issued: cardiovascular stimulant, not a lawful dietary ingredient.",
  },
  {
    ingredient: "homotaurine",
    display: "Homotaurine (Tramiprosate)",
    synonyms: ["tramiprosate", "acamprosate", "3-aminopropanesulfonic acid"],
    category: 3,
    severity: "medium",
    fda_url: FDA_LIST_URL,
    reason_short: "FDA: a drug, not a dietary ingredient. Unlawful in supplements.",
  },
  {
    ingredient: "dmaa",
    display: "DMAA",
    synonyms: ["1,3-dimethylamylamine", "methylhexanamine", "geranamine"],
    category: 3,
    severity: "critical",
    fda_url:
      "https://www.fda.gov/food/dietary-supplement-products-ingredients/dmaa-dietary-supplements",
    reason_short:
      "FDA banned: stimulant linked to heart attack, seizures, psychiatric disorders and death.",
  },
  {
    ingredient: "dmha",
    display: "DMHA",
    synonyms: ["octodrine", "1,5-dimethylhexylamine", "2-aminoisoheptane"],
    category: 3,
    severity: "high",
    fda_url:
      "https://www.fda.gov/food/hfp-constituent-updates/fda-acts-dietary-supplements-containing-dmha-and-phenibut",
    reason_short:
      "FDA action: stimulant not a lawful dietary ingredient; cardiovascular and psychiatric risks.",
  },

  // ------- Category 4: Approved drugs unlawful in supplements -------
  {
    ingredient: "ibuprofen",
    display: "Ibuprofen",
    synonyms: ["advil", "motrin", "nuprin", "midol"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: an approved drug. Hidden in a 'supplement' it bypasses dosing controls and risks GI bleeding, kidney damage and drug interactions.",
  },
  {
    ingredient: "naproxen",
    display: "Naproxen",
    synonyms: ["aleve", "anaprox", "naprosyn"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: an approved drug. Hidden in a 'supplement' it bypasses dosing controls and risks GI bleeding and kidney damage.",
  },
  {
    ingredient: "metformin",
    display: "Metformin",
    synonyms: ["glucophage", "fluamine", "n,n-dimethyldiguanide"],
    category: 4,
    severity: "critical",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: a prescription diabetes drug. In an unregulated supplement, risks dangerous hypoglycaemia and lactic acidosis.",
  },
  {
    ingredient: "lorcaserin",
    display: "Lorcaserin (Belviq)",
    synonyms: ["belviq", "belvig", "ar-10a", "apd-356"],
    category: 4,
    severity: "critical",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA withdrew this drug for cancer risk; remains unlawful in supplements.",
  },
  {
    ingredient: "indomethacin",
    display: "Indomethacin",
    synonyms: ["indocin", "indocid", "metindol"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short: "FDA: a prescription drug, unlawful in supplements.",
  },
  {
    ingredient: "piroxicam",
    display: "Piroxicam",
    synonyms: ["feldene"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short: "FDA: a prescription drug, unlawful in supplements.",
  },
  {
    ingredient: "galantamine",
    display: "Galantamine",
    synonyms: ["galantamine hbr"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: a prescription Alzheimer's drug, unlawful in supplements.",
  },
  {
    ingredient: "hcg",
    display: "HCG (Human chorionic gonadotropin)",
    synonyms: ["human chorionic gonadotropin", "pregnyl", "follutein"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: a prescription hormone. OTC 'HCG drops' for weight loss are illegal and ineffective.",
  },
  {
    ingredient: "l-dopa",
    display: "L-DOPA (Levodopa)",
    synonyms: ["levodopa", "larodopa", "l-3,4-dihydroxyphenylalanine"],
    category: 4,
    severity: "high",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA: a prescription Parkinson's drug. Cardiac and psychiatric risks; unlawful in supplements.",
  },
  {
    ingredient: "n-acetyl-l-cysteine",
    display: "N-acetyl-L-cysteine (NAC)",
    synonyms: ["nac", "n-acetylcysteine", "acetylcysteine"],
    category: 4,
    severity: "medium",
    fda_url:
      "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/guidance-industry-policy-regarding-n-acetyl-l-cysteine",
    reason_short:
      "FDA classifies NAC as a drug (originally approved for acetaminophen overdose). Enforcement discretion currently applied; consult your doctor on safe dosing.",
  },

  // ------- Category 7: Adulterated -------
  {
    ingredient: "hordenine",
    display: "Hordenine",
    synonyms: ["n,n-dimethyltyramine", "p-hydroxy-n,n-dimethylphenethylamine"],
    category: 7,
    severity: "medium",
    fda_url:
      "https://www.fda.gov/food/hfp-constituent-updates/fda-sends-warning-letters-multiple-companies-illegally-selling-adulterated-dietary-supplements",
    reason_short:
      "FDA: adulterated. Stimulant amine that is not a lawful dietary ingredient.",
  },
  {
    ingredient: "octopamine",
    display: "Octopamine",
    synonyms: ["para-octopamine", "p-octopamine", "norsynephrine"],
    category: 7,
    severity: "medium",
    fda_url:
      "https://www.fda.gov/food/hfp-constituent-updates/fda-sends-warning-letters-multiple-companies-illegally-selling-adulterated-dietary-supplements",
    reason_short:
      "FDA: adulterated. Stimulant amine; not a lawful dietary ingredient.",
  },
  {
    ingredient: "n-methyltyramine",
    display: "N-Methyltyramine (NMT)",
    synonyms: ["nmt", "methyl-4-tyramine", "4-hydroxy-n-methylphenethylamine"],
    category: 7,
    severity: "medium",
    fda_url:
      "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/carbon-fire-llc-664700-03012024",
    reason_short:
      "FDA: adulterated. Stimulant amine not lawful as a dietary ingredient.",
  },

  // ------- Hot-button items frequently in OTC supplements -------
  {
    ingredient: "garcinia cambogia",
    display: "Garcinia cambogia",
    synonyms: ["garcinia", "hydroxycitric acid", "hca"],
    category: 2,
    severity: "medium",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA-monitored: weight-loss supplements containing Garcinia have caused liver injury and hospitalisation in some users.",
  },
  {
    ingredient: "bitter orange",
    display: "Bitter orange (Synephrine)",
    synonyms: ["citrus aurantium", "synephrine", "p-synephrine"],
    category: 2,
    severity: "medium",
    fda_url: FDA_LIST_URL,
    reason_short:
      "FDA caution: stimulant similar to ephedrine; has been linked to elevated blood pressure, stroke and heart attack, especially with caffeine.",
  },
];

// Foods/nutrients we KNOW are safe and should never trigger a warning,
// even if openFDA returns lots of brand-level recalls (e.g. "vitamin d"
// brings back 569 product recalls — none of which mean vitamin D is unsafe).
export const SAFE_NUTRIENT_ALLOWLIST = new Set<string>([
  // Vitamins
  "vitamin a", "vitamin b", "vitamin b1", "vitamin b2", "vitamin b3", "vitamin b6",
  "vitamin b9", "vitamin b12", "vitamin c", "vitamin d", "vitamin d3", "vitamin e",
  "vitamin k", "thiamine", "riboflavin", "niacin", "pyridoxine", "cobalamin",
  "folate", "folic acid", "biotin", "pantothenic acid", "ascorbic acid",
  "cholecalciferol", "tocopherol",
  // Minerals
  "iron", "calcium", "magnesium", "zinc", "potassium", "sodium", "phosphorus",
  "selenium", "iodine", "chromium", "copper", "manganese",
  // Macros & basics
  "protein", "fibre", "fiber", "water", "omega-3", "omega 3", "omega-6", "omega 6",
  "fish oil", "olive oil", "honey", "yogurt", "milk", "egg", "eggs",
  // Common Nigerian whole foods
  "ugu", "efo", "efo riro", "ewedu", "okra", "garlic", "ginger", "tomato",
  "onion", "pepper", "scent leaf", "bitter leaf", "moringa", "moringa leaves",
  "groundnut", "beans", "rice", "yam", "plantain", "cassava", "millet",
  "sorghum", "sweet potato", "carrot", "spinach", "pumpkin", "watermelon",
  "orange", "banana", "mango", "pineapple", "pawpaw", "papaya", "avocado",
  "fish", "chicken", "beef", "turkey", "goat meat",
]);

const NORMALISE_RE = /[^\p{L}\p{N}\s-]/gu;
function normalise(s: string): string {
  return s.toLowerCase().replace(NORMALISE_RE, " ").replace(/\s+/g, " ").trim();
}

export function isSafeNutrient(term: string): boolean {
  const n = normalise(term);
  if (!n) return false;
  if (SAFE_NUTRIENT_ALLOWLIST.has(n)) return true;
  // Token-level — if every word is in the allowlist, treat as safe.
  const tokens = n.split(" ");
  if (tokens.length > 0 && tokens.every((t) => SAFE_NUTRIENT_ALLOWLIST.has(t))) return true;
  return false;
}

/** Return the first FDA ingredient whose canonical name OR any synonym appears
 *  as a whole-word match inside `term`. Returns null on no match. */
export function matchFdaIngredient(term: string): FdaIngredient | null {
  const n = normalise(term);
  if (!n) return null;
  for (const ing of FDA_INGREDIENTS) {
    const candidates = [ing.ingredient, ...ing.synonyms];
    for (const cand of candidates) {
      if (!cand) continue;
      // whole-word boundary match — avoid "iron" matching "environment"
      const re = new RegExp(`(^|\\s)${escapeRe(cand)}(\\s|$)`, "i");
      if (re.test(n)) return ing;
    }
  }
  return null;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
