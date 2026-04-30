// Curated, vetted medical references for biomarkers.
// Each entry maps a biomarker (matched case-insensitively against `name.includes`)
// to a list of credible source links from NIH MedlinePlus, Mayo Clinic, WHO, CDC, NHS.
// Used as a fallback when live Perplexity grounding is disabled.

export type MedicalCitation = {
  title: string;
  url: string;
  domain: string; // short label shown in UI
};

type CitationRule = {
  match: string; // lower-case substring to match against biomarker.name
  citations: MedicalCitation[];
};

const RULES: CitationRule[] = [
  {
    match: "glucose",
    citations: [
      { title: "Blood Glucose Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-glucose-test/", domain: "NIH MedlinePlus" },
      { title: "Diabetes — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444", domain: "Mayo Clinic" },
      { title: "Diabetes Fact Sheet — WHO", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", domain: "WHO" },
    ],
  },
  {
    match: "hba1c",
    citations: [
      { title: "Hemoglobin A1c (HbA1c) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/", domain: "NIH MedlinePlus" },
      { title: "A1C Test — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/a1c-test/about/pac-20384643", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "cholesterol",
    citations: [
      { title: "Cholesterol Levels — MedlinePlus", url: "https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html", domain: "NIH MedlinePlus" },
      { title: "High Cholesterol — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/symptoms-causes/syc-20350800", domain: "Mayo Clinic" },
      { title: "Cardiovascular Diseases — WHO", url: "https://www.who.int/health-topics/cardiovascular-diseases", domain: "WHO" },
    ],
  },
  {
    match: "ldl",
    citations: [
      { title: "LDL: The 'Bad' Cholesterol — MedlinePlus", url: "https://medlineplus.gov/ldlthebadcholesterol.html", domain: "NIH MedlinePlus" },
      { title: "Cholesterol Test — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/cholesterol-test/about/pac-20384601", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "hdl",
    citations: [
      { title: "HDL: The 'Good' Cholesterol — MedlinePlus", url: "https://medlineplus.gov/hdlthegoodcholesterol.html", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "triglyceride",
    citations: [
      { title: "Triglycerides Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/triglycerides-test/", domain: "NIH MedlinePlus" },
      { title: "Triglycerides — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/in-depth/triglycerides/art-20048186", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "hemoglobin",
    citations: [
      { title: "Hemoglobin Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hemoglobin-test/", domain: "NIH MedlinePlus" },
      { title: "Anaemia — WHO", url: "https://www.who.int/health-topics/anaemia", domain: "WHO" },
      { title: "Anemia — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/anemia/symptoms-causes/syc-20351360", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "hematocrit",
    citations: [
      { title: "Hematocrit Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hematocrit-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "platelet",
    citations: [
      { title: "Platelet Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/platelet-tests/", domain: "NIH MedlinePlus" },
      { title: "Thrombocytopenia — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/thrombocytopenia/symptoms-causes/syc-20378293", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "white blood",
    citations: [
      { title: "White Blood Count (WBC) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/white-blood-count-wbc/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "wbc",
    citations: [
      { title: "White Blood Count (WBC) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/white-blood-count-wbc/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "creatinine",
    citations: [
      { title: "Creatinine Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/creatinine-test/", domain: "NIH MedlinePlus" },
      { title: "Chronic Kidney Disease — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/chronic-kidney-disease/symptoms-causes/syc-20354521", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "urea",
    citations: [
      { title: "BUN (Blood Urea Nitrogen) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/bun-blood-urea-nitrogen/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "egfr",
    citations: [
      { title: "Glomerular Filtration Rate (GFR) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/glomerular-filtration-rate-gfr/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "alt",
    citations: [
      { title: "ALT Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/alt-blood-test/", domain: "NIH MedlinePlus" },
      { title: "Liver Function Tests — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/liver-function-tests/about/pac-20394595", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "ast",
    citations: [
      { title: "AST Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/ast-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "bilirubin",
    citations: [
      { title: "Bilirubin Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/bilirubin-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "potassium",
    citations: [
      { title: "Potassium Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/potassium-blood-test/", domain: "NIH MedlinePlus" },
      { title: "Hyperkalemia — Mayo Clinic", url: "https://www.mayoclinic.org/symptoms/hyperkalemia/basics/definition/sym-20050776", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "sodium",
    citations: [
      { title: "Sodium Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/sodium-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "calcium",
    citations: [
      { title: "Calcium Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/calcium-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "tsh",
    citations: [
      { title: "TSH (Thyroid-Stimulating Hormone) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/", domain: "NIH MedlinePlus" },
      { title: "Hypothyroidism — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "vitamin d",
    citations: [
      { title: "Vitamin D Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/vitamin-d-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "vitamin b12",
    citations: [
      { title: "Vitamin B12 Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/vitamin-b12-level/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "iron",
    citations: [
      { title: "Iron Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/iron-tests/", domain: "NIH MedlinePlus" },
      { title: "Iron Deficiency Anemia — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/iron-deficiency-anemia/symptoms-causes/syc-20355034", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "ferritin",
    citations: [
      { title: "Ferritin Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/ferritin-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "uric acid",
    citations: [
      { title: "Uric Acid Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/uric-acid-blood-test/", domain: "NIH MedlinePlus" },
      { title: "Gout — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/gout/symptoms-causes/syc-20372897", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "psa",
    citations: [
      { title: "PSA (Prostate-Specific Antigen) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/psa-test/", domain: "NIH MedlinePlus" },
    ],
  },
];

// Default fallback for biomarkers we don't have a curated entry for.
const FALLBACK: MedicalCitation[] = [
  { title: "Understanding Your Lab Results — MedlinePlus", url: "https://medlineplus.gov/lab-tests/", domain: "NIH MedlinePlus" },
];

export function getCitationsForBiomarker(name: string): MedicalCitation[] {
  if (!name) return FALLBACK;
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (lower.includes(rule.match)) return rule.citations;
  }
  return FALLBACK;
}

// All credible source domains used anywhere in the report — for the "Sources & Methodology" footer.
export const ALL_SOURCE_DOMAINS = [
  "NIH MedlinePlus (medlineplus.gov)",
  "Mayo Clinic (mayoclinic.org)",
  "World Health Organization (who.int)",
  "USDA FoodData Central (fdc.nal.usda.gov)",
];
