/**
 * VeriDIA Nutrition & Clinical Advisory Board
 *
 * NOTE: These profiles are clearly labeled as a SAMPLE / PROPOSED panel.
 * Real expert names, photos, and credentials will replace these once
 * advisory board agreements are finalized. Do not present them as
 * confirmed endorsers in marketing copy.
 */

export type AdvisoryMember = {
  id: string;
  name: string;
  credentials: string; // e.g. "RD, MPH"
  title: string;       // e.g. "Clinical Dietitian"
  affiliation: string; // hospital / university
  location: string;    // city, Nigeria
  focus: string[];     // areas of expertise
  bio: string;
  initials: string;
  accent: "primary" | "secondary" | "accent" | "destructive";
};

export const ADVISORY_BOARD_STATUS = {
  label: "Sample panel — pending confirmation",
  note:
    "The names below illustrate the composition of VeriDIA's proposed Nutrition & Clinical Advisory Board. " +
    "Final members and credentials will be published here once advisory agreements are signed.",
} as const;

export const advisoryBoard: AdvisoryMember[] = [
  {
    id: "chair-endocrinology",
    name: "Dr. Adaeze Okonkwo",
    credentials: "MBBS, FWACP (Endocrinology)",
    title: "Board Chair · Consultant Endocrinologist",
    affiliation: "University College Hospital (UCH), Ibadan",
    location: "Ibadan, Nigeria",
    focus: ["Type 2 Diabetes", "Thyroid Disorders", "Metabolic Syndrome"],
    bio:
      "Reviews VeriDIA's clinical safety thresholds and emergency-alert logic to ensure recommendations align with Nigerian endocrinology practice.",
    initials: "AO",
    accent: "secondary",
  },
  {
    id: "lead-dietitian",
    name: "Mrs. Funmilayo Adeyemi",
    credentials: "RD, MSc Human Nutrition",
    title: "Lead Registered Dietitian",
    affiliation: "Lagos University Teaching Hospital (LUTH)",
    location: "Lagos, Nigeria",
    focus: ["Therapeutic Diets", "Renal Nutrition", "Cardiometabolic Diets"],
    bio:
      "Validates every diet plan template against Nigerian food culture, portion realism, and affordability for families across geopolitical zones.",
    initials: "FA",
    accent: "primary",
  },
  {
    id: "public-health",
    name: "Prof. Ibrahim Musa",
    credentials: "PhD Public Health Nutrition",
    title: "Public Health Nutrition Advisor",
    affiliation: "Ahmadu Bello University, Zaria",
    location: "Zaria, Nigeria",
    focus: ["Northern Nigerian Diets", "Micronutrient Deficiency", "Maternal Nutrition"],
    bio:
      "Guides regional adaptation of diet plans across the North West, North East, and North Central zones, with attention to fasting and cultural practices.",
    initials: "IM",
    accent: "accent",
  },
  {
    id: "paediatrics",
    name: "Dr. Chiamaka Eze",
    credentials: "MBBS, FMCPaed",
    title: "Paediatric Nutrition Advisor",
    affiliation: "National Hospital, Abuja",
    location: "Abuja, Nigeria",
    focus: ["Childhood Obesity", "Growth Faltering", "Adolescent Diabetes"],
    bio:
      "Reviews dependant-mode plans for children and adolescents and ensures age-appropriate portions and growth-safe recommendations.",
    initials: "CE",
    accent: "destructive",
  },
  {
    id: "food-science",
    name: "Dr. Ngozi Bassey",
    credentials: "PhD Food Science & Technology",
    title: "Food Composition Advisor",
    affiliation: "University of Nigeria, Nsukka",
    location: "Nsukka, Nigeria",
    focus: ["Local Food Composition", "Glycaemic Index of Nigerian Staples", "NAFDAC Liaison"],
    bio:
      "Maintains the local-food composition mapping that powers swaps like ofada rice, unripe plantain, and acha — and supports NAFDAC verification of recommended brands.",
    initials: "NB",
    accent: "primary",
  },
  {
    id: "community-care",
    name: "Mr. Tunde Balogun",
    credentials: "BSc Nutrition & Dietetics, NIM",
    title: "Community Care & Caregiver Liaison",
    affiliation: "Independent Practice · Port Harcourt",
    location: "Port Harcourt, Nigeria",
    focus: ["Caregiver Coaching", "Low-Literacy Communication", "Pidgin Health Education"],
    bio:
      "Reviews plain-language and Pidgin translations so that caregivers without medical training can act on VeriDIA recommendations confidently.",
    initials: "TB",
    accent: "secondary",
  },
];

export const boardResponsibilities = [
  {
    title: "Clinical safety review",
    desc: "Validate emergency-alert thresholds (e.g. critical glucose, HbA1c, potassium) used by the Emergency Alert Protocol.",
  },
  {
    title: "Diet plan validation",
    desc: "Review diet templates for Nigerian food authenticity, portion realism, and cultural fit across all six geopolitical zones.",
  },
  {
    title: "Source curation",
    desc: "Approve the medical citations and food composition sources surfaced in every report's Sources section.",
  },
  {
    title: "Quarterly content audit",
    desc: "Sample-audit AI-generated reports each quarter and feed corrections back into VeriDIA's prompts and guardrails.",
  },
];
