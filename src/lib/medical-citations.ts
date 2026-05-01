// Curated, vetted medical references for biomarkers.
// Each entry maps a biomarker (matched case-insensitively against `name.includes`)
// to a list of credible source links from international authorities (NIH MedlinePlus,
// Mayo Clinic, WHO, CDC, NHS) and Nigerian / African authorities (FMOH, Africa CDC,
// WHO Africa, Nigerian Heart Foundation).
//
// The Gemini interpretation is *never* the source of these URLs — they are attached
// from this allow-list so the report cannot link to a hallucinated reference.

export type CitationRegion = "global" | "africa" | "nigeria";

export type MedicalCitation = {
  title: string;
  url: string;
  domain: string; // short label shown in UI
  region?: CitationRegion; // defaults to "global"
};

type CitationRule = {
  match: string; // lower-case substring to match against biomarker.name
  citations: MedicalCitation[];
};

// Re-usable Nigerian / African anchor entries.
const AFRICA_DIABETES: MedicalCitation = {
  title: "Diabetes — WHO Africa",
  url: "https://www.afro.who.int/health-topics/diabetes",
  domain: "WHO Africa",
  region: "africa",
};
const AFRICA_CVD: MedicalCitation = {
  title: "Cardiovascular Diseases — WHO Africa",
  url: "https://www.afro.who.int/health-topics/cardiovascular-diseases",
  domain: "WHO Africa",
  region: "africa",
};
const AFRICA_NCD: MedicalCitation = {
  title: "Non-Communicable Diseases — Africa CDC",
  url: "https://africacdc.org/programme/non-communicable-diseases-injuries-prevention-and-control/",
  domain: "Africa CDC",
  region: "africa",
};
const AFRICA_MALARIA: MedicalCitation = {
  title: "Malaria — WHO Africa",
  url: "https://www.afro.who.int/health-topics/malaria",
  domain: "WHO Africa",
  region: "africa",
};
const AFRICA_HIV: MedicalCitation = {
  title: "HIV/AIDS — WHO Africa",
  url: "https://www.afro.who.int/health-topics/hivaids",
  domain: "WHO Africa",
  region: "africa",
};
const AFRICA_HEPATITIS: MedicalCitation = {
  title: "Hepatitis — WHO Africa",
  url: "https://www.afro.who.int/health-topics/hepatitis",
  domain: "WHO Africa",
  region: "africa",
};
const NG_HEART: MedicalCitation = {
  title: "Nigerian Heart Foundation",
  url: "https://nigerianheartfoundation.org/",
  domain: "Nigerian Heart Foundation",
  region: "nigeria",
};
const NG_FMOH: MedicalCitation = {
  title: "Federal Ministry of Health, Nigeria",
  url: "https://www.health.gov.ng/",
  domain: "FMOH Nigeria",
  region: "nigeria",
};
const AFRICA_ANAEMIA: MedicalCitation = {
  title: "Anaemia — WHO Africa",
  url: "https://www.afro.who.int/health-topics/anaemia",
  domain: "WHO Africa",
  region: "africa",
};

// U.S. FDA — global authority on food safety, supplement standards and Nutrition Facts labels.
const US_FDA_NUTRITION: MedicalCitation = {
  title: "Nutrition Facts Label — U.S. FDA",
  url: "https://www.fda.gov/food/nutrition-facts-label",
  domain: "U.S. FDA",
};
const US_FDA_SODIUM: MedicalCitation = {
  title: "Sodium in Your Diet — U.S. FDA",
  url: "https://www.fda.gov/food/nutrition-education-resources-materials/sodium-your-diet",
  domain: "U.S. FDA",
};
const US_FDA_SUPPLEMENTS: MedicalCitation = {
  title: "Dietary Supplements — U.S. FDA",
  url: "https://www.fda.gov/food/dietary-supplements",
  domain: "U.S. FDA",
};

// NAFDAC — Nigerian regulator for food, drugs and supplements.
const NAFDAC_FOOD: MedicalCitation = {
  title: "Food Safety & Applied Nutrition — NAFDAC",
  url: "https://nafdac.gov.ng/our-services/registration-services/food/",
  domain: "NAFDAC",
  region: "nigeria",
};
const NAFDAC_DRUGS: MedicalCitation = {
  title: "Drug Registration & Regulation — NAFDAC",
  url: "https://nafdac.gov.ng/our-services/registration-services/drug/",
  domain: "NAFDAC",
  region: "nigeria",
};

const RULES: CitationRule[] = [
  // ─── Glycaemic ───────────────────────────────────────────
  {
    match: "glucose",
    citations: [
      { title: "Blood Glucose Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-glucose-test/", domain: "NIH MedlinePlus" },
      { title: "Diabetes — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444", domain: "Mayo Clinic" },
      { title: "Diabetes Fact Sheet — WHO", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", domain: "WHO" },
      US_FDA_NUTRITION,
      AFRICA_DIABETES,
      NG_FMOH,
    ],
  },
  {
    match: "hba1c",
    citations: [
      { title: "Hemoglobin A1c (HbA1c) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/", domain: "NIH MedlinePlus" },
      { title: "A1C Test — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/a1c-test/about/pac-20384643", domain: "Mayo Clinic" },
      AFRICA_DIABETES,
    ],
  },
  {
    match: "insulin",
    citations: [
      { title: "Insulin in Blood — MedlinePlus", url: "https://medlineplus.gov/lab-tests/insulin-in-blood/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "homa",
    citations: [
      { title: "Insulin Resistance & Prediabetes — NIDDK", url: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance", domain: "NIH NIDDK" },
    ],
  },

  // ─── Lipids ──────────────────────────────────────────────
  {
    match: "cholesterol",
    citations: [
      { title: "Cholesterol Levels — MedlinePlus", url: "https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html", domain: "NIH MedlinePlus" },
      { title: "High Cholesterol — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/symptoms-causes/syc-20350800", domain: "Mayo Clinic" },
      { title: "Cardiovascular Diseases — WHO", url: "https://www.who.int/health-topics/cardiovascular-diseases", domain: "WHO" },
      US_FDA_NUTRITION,
      AFRICA_CVD,
      NG_HEART,
    ],
  },
  {
    match: "ldl",
    citations: [
      { title: "LDL: The 'Bad' Cholesterol — MedlinePlus", url: "https://medlineplus.gov/ldlthebadcholesterol.html", domain: "NIH MedlinePlus" },
      { title: "Cholesterol Test — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/cholesterol-test/about/pac-20384601", domain: "Mayo Clinic" },
      US_FDA_NUTRITION,
      NG_HEART,
    ],
  },
  {
    match: "hdl",
    citations: [
      { title: "HDL: The 'Good' Cholesterol — MedlinePlus", url: "https://medlineplus.gov/hdlthegoodcholesterol.html", domain: "NIH MedlinePlus" },
      US_FDA_NUTRITION,
      NG_HEART,
    ],
  },
  {
    match: "vldl",
    citations: [
      { title: "Cholesterol Levels — MedlinePlus", url: "https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "non-hdl",
    citations: [
      { title: "Cholesterol Test — Mayo Clinic", url: "https://www.mayoclinic.org/tests-procedures/cholesterol-test/about/pac-20384601", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "lipoprotein",
    citations: [
      { title: "Lipoprotein(a) — MedlinePlus Genetics", url: "https://medlineplus.gov/genetics/gene/lpa/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "triglyceride",
    citations: [
      { title: "Triglycerides Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/triglycerides-test/", domain: "NIH MedlinePlus" },
      { title: "Triglycerides — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/high-blood-cholesterol/in-depth/triglycerides/art-20048186", domain: "Mayo Clinic" },
      US_FDA_NUTRITION,
      NG_HEART,
    ],
  },

  // ─── FBC / Haematology ───────────────────────────────────
  {
    match: "hemoglobin",
    citations: [
      { title: "Hemoglobin Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hemoglobin-test/", domain: "NIH MedlinePlus" },
      { title: "Anaemia — WHO", url: "https://www.who.int/health-topics/anaemia", domain: "WHO" },
      { title: "Anemia — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/anemia/symptoms-causes/syc-20351360", domain: "Mayo Clinic" },
      AFRICA_ANAEMIA,
    ],
  },
  {
    match: "haemoglobin",
    citations: [
      { title: "Hemoglobin Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hemoglobin-test/", domain: "NIH MedlinePlus" },
      AFRICA_ANAEMIA,
    ],
  },
  {
    match: "hematocrit",
    citations: [
      { title: "Hematocrit Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hematocrit-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "haematocrit",
    citations: [
      { title: "Hematocrit Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hematocrit-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "mcv",
    citations: [
      { title: "Complete Blood Count (CBC) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "mch",
    citations: [
      { title: "Complete Blood Count (CBC) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "rdw",
    citations: [
      { title: "RBC Indices — MedlinePlus", url: "https://medlineplus.gov/ency/article/003648.htm", domain: "NIH MedlinePlus" },
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
    match: "neutrophil",
    citations: [
      { title: "Blood Differential Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-differential-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "lymphocyte",
    citations: [
      { title: "Blood Differential Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-differential-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "eosinophil",
    citations: [
      { title: "Eosinophil Count — MedlinePlus", url: "https://medlineplus.gov/ency/article/003649.htm", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "monocyte",
    citations: [
      { title: "Blood Differential Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-differential-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "basophil",
    citations: [
      { title: "Blood Differential Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/blood-differential-test/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Kidney / U&E ────────────────────────────────────────
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
    match: "bun",
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

  // ─── Electrolytes ────────────────────────────────────────
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
    match: "chloride",
    citations: [
      { title: "Chloride Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/chloride-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "bicarbonate",
    citations: [
      { title: "CO2 Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/co2-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "calcium",
    citations: [
      { title: "Calcium Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/calcium-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "magnesium",
    citations: [
      { title: "Magnesium Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/magnesium-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "phosphate",
    citations: [
      { title: "Phosphate in Blood — MedlinePlus", url: "https://medlineplus.gov/lab-tests/phosphate-in-blood/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "phosphorus",
    citations: [
      { title: "Phosphate in Blood — MedlinePlus", url: "https://medlineplus.gov/lab-tests/phosphate-in-blood/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Liver Function ──────────────────────────────────────
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
    match: "alp",
    citations: [
      { title: "ALP Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/alp-alkaline-phosphatase-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "alkaline phosphatase",
    citations: [
      { title: "ALP Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/alp-alkaline-phosphatase-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "ggt",
    citations: [
      { title: "GGT Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/gamma-glutamyl-transferase-ggt-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "bilirubin",
    citations: [
      { title: "Bilirubin Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/bilirubin-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "albumin",
    citations: [
      { title: "Albumin Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/albumin-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "total protein",
    citations: [
      { title: "Total Protein Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/total-protein-and-a-g-ratio/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "globulin",
    citations: [
      { title: "Total Protein & A/G Ratio — MedlinePlus", url: "https://medlineplus.gov/lab-tests/total-protein-and-a-g-ratio/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Endocrine / Thyroid ─────────────────────────────────
  {
    match: "tsh",
    citations: [
      { title: "TSH (Thyroid-Stimulating Hormone) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/", domain: "NIH MedlinePlus" },
      { title: "Hypothyroidism — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284", domain: "Mayo Clinic" },
    ],
  },
  {
    match: "free t4",
    citations: [
      { title: "T4 Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/t4-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "free t3",
    citations: [
      { title: "T3 Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/t3-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "cortisol",
    citations: [
      { title: "Cortisol Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/cortisol-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "prolactin",
    citations: [
      { title: "Prolactin Levels Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/prolactin-levels-test/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Reproductive ────────────────────────────────────────
  {
    match: "fsh",
    citations: [
      { title: "Follicle-Stimulating Hormone (FSH) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/follicle-stimulating-hormone-fsh-levels-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "lh",
    citations: [
      { title: "Luteinizing Hormone (LH) — MedlinePlus", url: "https://medlineplus.gov/lab-tests/luteinizing-hormone-lh-levels-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "estradiol",
    citations: [
      { title: "Estrogen Levels Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/estrogen-levels-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "testosterone",
    citations: [
      { title: "Testosterone Levels — MedlinePlus", url: "https://medlineplus.gov/lab-tests/testosterone-levels-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "hcg",
    citations: [
      { title: "hCG Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/human-chorionic-gonadotropin-hcg-test/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Vitamins & Minerals ─────────────────────────────────
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
    match: "folate",
    citations: [
      { title: "Folate Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/folate-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "iron",
    citations: [
      { title: "Iron Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/iron-tests/", domain: "NIH MedlinePlus" },
      { title: "Iron Deficiency Anemia — Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/iron-deficiency-anemia/symptoms-causes/syc-20355034", domain: "Mayo Clinic" },
      AFRICA_ANAEMIA,
    ],
  },
  {
    match: "ferritin",
    citations: [
      { title: "Ferritin Blood Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/ferritin-blood-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "transferrin",
    citations: [
      { title: "Iron Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/iron-tests/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Inflammation ────────────────────────────────────────
  {
    match: "crp",
    citations: [
      { title: "C-Reactive Protein (CRP) Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "esr",
    citations: [
      { title: "ESR Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/esr-erythrocyte-sedimentation-rate/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "procalcitonin",
    citations: [
      { title: "Procalcitonin Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/procalcitonin-test/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Other ───────────────────────────────────────────────
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

  // ─── Infectious / Tropical (Nigerian context) ────────────
  {
    match: "malaria",
    citations: [
      { title: "Malaria — WHO Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail/malaria", domain: "WHO" },
      { title: "Malaria — CDC", url: "https://www.cdc.gov/malaria/", domain: "CDC" },
      AFRICA_MALARIA,
      NG_FMOH,
    ],
  },
  {
    match: "hiv",
    citations: [
      { title: "HIV Screening Test — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hiv-screening-test/", domain: "NIH MedlinePlus" },
      { title: "HIV — WHO Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail/hiv-aids", domain: "WHO" },
      AFRICA_HIV,
    ],
  },
  {
    match: "hbsag",
    citations: [
      { title: "Hepatitis B Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hepatitis-b-tests/", domain: "NIH MedlinePlus" },
      { title: "Hepatitis B — WHO", url: "https://www.who.int/news-room/fact-sheets/detail/hepatitis-b", domain: "WHO" },
      AFRICA_HEPATITIS,
    ],
  },
  {
    match: "hepatitis b",
    citations: [
      { title: "Hepatitis B Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hepatitis-b-tests/", domain: "NIH MedlinePlus" },
      AFRICA_HEPATITIS,
    ],
  },
  {
    match: "hcv",
    citations: [
      { title: "Hepatitis C Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hepatitis-c-tests/", domain: "NIH MedlinePlus" },
      AFRICA_HEPATITIS,
    ],
  },
  {
    match: "hepatitis c",
    citations: [
      { title: "Hepatitis C Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/hepatitis-c-tests/", domain: "NIH MedlinePlus" },
      AFRICA_HEPATITIS,
    ],
  },
  {
    match: "vdrl",
    citations: [
      { title: "Syphilis Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/syphilis-tests/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "widal",
    citations: [
      { title: "Typhoid Fever — CDC", url: "https://www.cdc.gov/typhoid-fever/", domain: "CDC" },
      { title: "Typhoid — WHO Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail/typhoid", domain: "WHO" },
    ],
  },
  {
    match: "typhoid",
    citations: [
      { title: "Typhoid — WHO Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail/typhoid", domain: "WHO" },
      { title: "Typhoid Fever — CDC", url: "https://www.cdc.gov/typhoid-fever/", domain: "CDC" },
    ],
  },
  {
    match: "h. pylori",
    citations: [
      { title: "Helicobacter pylori (H. pylori) Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/helicobacter-pylori-h-pylori-tests/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "pylori",
    citations: [
      { title: "Helicobacter pylori (H. pylori) Tests — MedlinePlus", url: "https://medlineplus.gov/lab-tests/helicobacter-pylori-h-pylori-tests/", domain: "NIH MedlinePlus" },
    ],
  },

  // ─── Urinalysis ──────────────────────────────────────────
  {
    match: "urinalysis",
    citations: [
      { title: "Urinalysis — MedlinePlus", url: "https://medlineplus.gov/lab-tests/urinalysis/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "urine protein",
    citations: [
      { title: "Protein in Urine — MedlinePlus", url: "https://medlineplus.gov/lab-tests/protein-in-urine/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "ketone",
    citations: [
      { title: "Ketones in Urine — MedlinePlus", url: "https://medlineplus.gov/lab-tests/ketones-in-urine/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "leukocyte esterase",
    citations: [
      { title: "Urinalysis — MedlinePlus", url: "https://medlineplus.gov/lab-tests/urinalysis/", domain: "NIH MedlinePlus" },
    ],
  },
  {
    match: "nitrite",
    citations: [
      { title: "Urinalysis — MedlinePlus", url: "https://medlineplus.gov/lab-tests/urinalysis/", domain: "NIH MedlinePlus" },
    ],
  },
];

// Default fallback for biomarkers we don't have a curated entry for.
const FALLBACK: MedicalCitation[] = [
  { title: "Understanding Your Lab Results — MedlinePlus", url: "https://medlineplus.gov/lab-tests/", domain: "NIH MedlinePlus" },
];

function findRule(name: string): CitationRule | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (lower.includes(rule.match)) return rule;
  }
  return null;
}

export function getCitationsForBiomarker(name: string): MedicalCitation[] {
  return findRule(name)?.citations ?? FALLBACK;
}

/** True when we have a curated, biomarker-specific source (not just the generic fallback). */
export function hasCuratedCitation(name: string): boolean {
  return findRule(name) !== null;
}

/** Returns the top-priority domain to display in the "Cross-checked against …" badge. */
export function getPrimaryDomain(name: string): string | null {
  const rule = findRule(name);
  if (!rule || rule.citations.length === 0) return null;
  // Prefer global authority (NIH MedlinePlus first, then Mayo, then WHO) for the badge.
  const order = ["NIH MedlinePlus", "Mayo Clinic", "WHO"];
  for (const pref of order) {
    const hit = rule.citations.find((c) => c.domain === pref);
    if (hit) return hit.domain;
  }
  return rule.citations[0].domain;
}

// All credible source domains used anywhere in the report — for the "Sources & Methodology" footer.
export const ALL_SOURCE_DOMAINS = [
  "NIH MedlinePlus (medlineplus.gov)",
  "Mayo Clinic (mayoclinic.org)",
  "World Health Organization (who.int)",
  "WHO Africa (afro.who.int)",
  "U.S. CDC (cdc.gov)",
  "Africa CDC (africacdc.org)",
  "Federal Ministry of Health, Nigeria (health.gov.ng)",
  "Nigerian Heart Foundation (nigerianheartfoundation.org)",
  "USDA FoodData Central (fdc.nal.usda.gov)",
];

/* ─────────────────────────────────────────────────────────────────────────
 * Public catalog used by the /sources methodology page for deep links.
 * Each entry is a curated biomarker + its citations. Anchor format:
 *   #bio-{slug}  e.g. "hba1c" → "#bio-hba1c", "vitamin d" → "#bio-vitamin-d"
 * ─────────────────────────────────────────────────────────────────────── */

export type BiomarkerCatalogEntry = {
  /** Stable slug used in the URL hash, e.g. "hba1c" */
  slug: string;
  /** Display name derived from the match key */
  label: string;
  citations: MedicalCitation[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCaseLabel = (s: string) => {
  // Keep common short medical acronyms uppercase.
  const ACRONYMS = new Set([
    "alt", "ast", "alp", "ggt", "tsh", "ldl", "hdl", "vldl", "wbc", "rbc",
    "mcv", "mch", "rdw", "egfr", "bun", "crp", "esr", "psa", "hcg", "fsh",
    "lh", "hba1c", "hbsag", "hcv", "hiv", "vdrl", "pcv", "inr", "pt", "aptt",
    "g6pd", "tibc", "ft3", "ft4", "t3", "t4", "ncd",
  ]);
  return s
    .split(/\s+/)
    .map((w) => {
      if (ACRONYMS.has(w)) return w.toUpperCase();
      if (w.length <= 2) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
};

export const BIOMARKER_CATALOG: BiomarkerCatalogEntry[] = RULES.map((r) => ({
  slug: slugify(r.match),
  label: titleCaseLabel(r.match),
  citations: r.citations,
}));

/** All biomarker entries that cite a given source domain. */
export function getBiomarkersForDomain(domain: string): BiomarkerCatalogEntry[] {
  return BIOMARKER_CATALOG.filter((b) =>
    b.citations.some((c) => c.domain === domain)
  );
}

