/**
 * Trusted source logos for the landing page.
 *
 * Logos are bundled locally under `src/assets/sources/` so they ship from
 * our own origin (no Wikimedia hot-linking, no broken images). Each org's
 * official mark is used under nominative fair use — we link to their
 * homepage and the disclaimer below makes clear we are not affiliated.
 *
 * If a `logo` is missing for any source, the typographic `SourceLogo`
 * tile is rendered as an automatic fallback.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Bundled official logos — Vite fingerprints these and serves them from our origin.
import logoMedlinePlus from "@/assets/sources/nih-medlineplus.png";
import logoMayoClinic from "@/assets/sources/mayo-clinic.svg";
import logoWHO from "@/assets/sources/who.svg";
import logoCDC from "@/assets/sources/cdc.svg";
import logoUSDA from "@/assets/sources/usda.svg";
import logoAfricaCDC from "@/assets/sources/africa-cdc.png";
import logoFMOH from "@/assets/sources/fmoh-nigeria.svg";
import logoNHF from "@/assets/sources/nigerian-heart-foundation.png";

export type TrustedSource = {
  name: string;
  /** Public homepage / area we cite from */
  url: string;
  /** Short acronym/monogram shown in the typographic fallback tile */
  mark: string;
  /** Wordmark line 1 (main name) — used in the typographic fallback */
  wordmark: string;
  /** Optional wordmark line 2 (subtitle, e.g. "MedlinePlus") */
  subWordmark?: string;
  /**
   * Bundled official logo (SVG/PNG). When present, rendered as an <img>;
   * when absent, the typographic SourceLogo tile is rendered instead.
   */
  logo?: string;
  /** Tier shown in the full section */
  tier: "International" | "Naija & Africa" | "Nutrition";
  /** Short description for the full section */
  cite: string;
  /**
   * Domain key matching the `domain` strings used in
   * `src/lib/medical-citations.ts`. Used to look up which biomarkers
   * cite this source so the methodology page can deep-link them.
   * Use null when the source isn't part of the biomarker citation map
   * (e.g. USDA, which is used only for nutrition verification).
   */
  domain: string | null;
};

export const TRUSTED_SOURCES: TrustedSource[] = [
  {
    name: "NIH MedlinePlus",
    url: "https://medlineplus.gov/",
    mark: "NIH",
    wordmark: "National Institutes",
    subWordmark: "of Health · MedlinePlus",
    logo: logoMedlinePlus,
    tier: "International",
    cite: "Plain-language explanations for every lab test we interpret.",
    domain: "NIH MedlinePlus",
  },
  {
    name: "Mayo Clinic",
    url: "https://www.mayoclinic.org/",
    mark: "M",
    wordmark: "MAYO",
    subWordmark: "CLINIC",
    logo: logoMayoClinic,
    tier: "International",
    cite: "Clinical condition references for cholesterol, diabetes, anaemia and more.",
    domain: "Mayo Clinic",
  },
  {
    name: "World Health Organization",
    url: "https://www.who.int/",
    mark: "WHO",
    wordmark: "World Health",
    subWordmark: "Organization",
    logo: logoWHO,
    tier: "International",
    cite: "Global fact sheets on cardiovascular disease, diabetes, anaemia, HIV and TB.",
    domain: "WHO",
  },
  {
    name: "U.S. CDC",
    url: "https://www.cdc.gov/",
    mark: "CDC",
    wordmark: "Centers for Disease",
    subWordmark: "Control & Prevention",
    logo: logoCDC,
    tier: "International",
    cite: "Disease control guidance for malaria, HIV and infectious panels.",
    domain: "CDC",
  },
  {
    name: "USDA FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    mark: "USDA",
    wordmark: "FoodData",
    subWordmark: "Central",
    logo: logoUSDA,
    tier: "Nutrition",
    cite: "Live nutrient lookup verifies every food we recommend in your diet plan.",
    domain: null,
  },
  {
    name: "WHO Africa",
    url: "https://www.afro.who.int/",
    mark: "AFRO",
    wordmark: "WHO Regional Office",
    subWordmark: "for Africa",
    // No clean public WHO Africa mark available — render the styled typographic tile.
    tier: "Naija & Africa",
    cite: "Region-specific guidance for diseases prevalent in sub-Saharan Africa.",
    domain: "WHO Africa",
  },
  {
    name: "Africa CDC",
    url: "https://africacdc.org/",
    mark: "ACDC",
    wordmark: "Africa Centres",
    subWordmark: "for Disease Control",
    logo: logoAfricaCDC,
    tier: "Naija & Africa",
    cite: "Continental authority on infectious disease screening and prevention.",
    domain: "Africa CDC",
  },
  {
    name: "Federal Ministry of Health, Nigeria",
    url: "https://www.health.gov.ng/",
    mark: "FMOH",
    wordmark: "Federal Ministry",
    subWordmark: "of Health · Nigeria",
    logo: logoFMOH,
    tier: "Naija & Africa",
    cite: "National policy reference for clinical and dietary guidelines in Nigeria.",
    domain: "FMOH Nigeria",
  },
  {
    name: "Nigerian Heart Foundation",
    url: "https://nigerianheart.org/",
    mark: "NHF",
    wordmark: "Nigerian Heart",
    subWordmark: "Foundation",
    logo: logoNHF,
    tier: "Naija & Africa",
    cite: "Local authority for hypertension and cardiovascular guidance.",
    domain: "Nigerian Heart Foundation",
  },
];

/* ─────────────────────────────────────────────────────────────
 * Reusable logo tile
 *  - If the source has a bundled `logo`, render it as an <img>.
 *  - Otherwise (or if the image fails to load), fall back to the
 *    typographic tile so the layout never collapses.
 * ───────────────────────────────────────────────────────────── */

type SourceLogoProps = {
  source: TrustedSource;
  variant?: "strip" | "card";
  className?: string;
};

/** Typographic fallback tile — used when no `logo` is bundled or it fails. */
const TypographicLogo = ({ source, variant = "strip", className }: SourceLogoProps) => {
  const isStrip = variant === "strip";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 select-none transition-transform duration-300 ease-out group-hover:scale-110",
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-md font-bold tracking-tight border transition-colors duration-300",
          "border-border bg-muted/60 text-muted-foreground",
          "dark:border-foreground/20 dark:bg-foreground/[0.06] dark:text-foreground/85",
          "group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary",
          isStrip ? "h-9 px-2 min-w-[36px] text-[11px]" : "h-10 px-2.5 min-w-[40px] text-xs"
        )}
      >
        {source.mark}
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold uppercase tracking-tight transition-colors duration-300",
            "text-foreground/70 dark:text-foreground/85 group-hover:text-foreground",
            isStrip ? "text-[10px] sm:text-[11px]" : "text-xs"
          )}
        >
          {source.wordmark}
        </span>
        {source.subWordmark && (
          <span
            className={cn(
              "uppercase tracking-tight font-medium mt-0.5 transition-colors duration-300",
              "text-muted-foreground group-hover:text-foreground/80",
              isStrip ? "text-[9px] sm:text-[10px]" : "text-[10px]"
            )}
          >
            {source.subWordmark}
          </span>
        )}
      </div>
    </div>
  );
};

const SourceLogo = ({ source, variant = "strip", className }: SourceLogoProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!source.logo || imgFailed) {
    return <TypographicLogo source={source} variant={variant} className={className} />;
  }

  // Real logo: cap the height so all marks line up regardless of aspect ratio.
  // Bold and full-color at rest; scale up on hover for a confident "logo wall" feel.
  const isStrip = variant === "strip";
  return (
    <div
      className={cn(
        "flex items-center justify-center select-none",
        className
      )}
    >
      <img
        src={source.logo}
        alt={source.name}
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
        className={cn(
          "object-contain transition-transform duration-300 ease-out group-hover:scale-110",
          isStrip
            ? "max-h-10 sm:max-h-12 max-w-[160px] sm:max-w-[180px]"
            : "max-h-14 max-w-[200px]"
        )}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
 * 1. Compact strip — sits right under the hero
 * ───────────────────────────────────────────────────────────── */
export const TrustLogosStrip = () => {
  // Pick the 6 most globally recognised for the strip
  const strip = TRUSTED_SOURCES.filter((s) =>
    ["NIH MedlinePlus", "Mayo Clinic", "World Health Organization", "U.S. CDC", "USDA FoodData Central", "Africa CDC"].includes(s.name)
  );

  return (
    <section
      aria-label="Trusted medical sources"
      className="py-10 md:py-14 px-4 border-y border-border/60 bg-card/40"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2 text-center">
          <ShieldCheck className="w-4 h-4 text-secondary" aria-hidden />
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Every interpretation cross-checked against
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-5 items-center">
          {strip.map((s, i) => (
            <motion.a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group flex items-center justify-center min-h-[44px]"
              title={`${s.name} — opens in new tab`}
              aria-label={s.name}
            >
              <SourceLogo source={s} variant="strip" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────
 * 2. Full section — mid-page, with methodology blurb
 * ───────────────────────────────────────────────────────────── */
export const TrustedSourcesSection = () => {
  const tiers: Array<TrustedSource["tier"]> = ["International", "Naija & Africa", "Nutrition"];

  return (
    <section
      id="our-sources"
      aria-labelledby="our-sources-heading"
      className="relative py-20 md:py-28 px-4 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
            Why you can trust VeriDIA
          </p>
          <h2 id="our-sources-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Backed by science.<br className="hidden sm:block" /> Grounded in Naija reality.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg pt-2">
            Our AI does the reading — but every interpretation is cross-checked against the same
            authorities your doctor learned from. No invented links. No made-up advice.
          </p>
        </div>

        {tiers.map((tier) => {
          const items = TRUSTED_SOURCES.filter((s) => s.tier === tier);
          if (!items.length) return null;
          return (
            <div key={tier} className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {tier}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "source" : "sources"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s, i) => (
                  <motion.a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <SourceLogo source={s} variant="card" />
                      <ExternalLink className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors flex-shrink-0" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.cite}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          );
        })}

        {/* Disclaimer */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 max-w-3xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            <span className="font-semibold text-foreground">A note on the marks above: </span>
            All trademarks and names are the property of their respective owners.
            VeriDIA references their publicly available guidelines and lab-test pages —
            we are not affiliated with, endorsed by, or sponsored by any of these organisations.
            Every result you see in the app links directly to its specific source page so you can verify it yourself.
          </p>
        </div>

        {/* Methodology link */}
        <div className="text-center">
          <a
            href="/sources"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Read the full Sources & Methodology
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
