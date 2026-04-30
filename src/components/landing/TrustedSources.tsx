/**
 * Trusted source logos for the landing page.
 *
 * Logos are loaded from Wikimedia Commons (stable, editorial-use SVGs).
 * They are displayed greyscale + reduced opacity, lifting to full
 * colour on hover, with a clear disclaimer that VeriDIA is not
 * affiliated with or endorsed by these organisations — we cite their
 * publicly available guidelines.
 */

import { motion } from "framer-motion";
import { ShieldCheck, ExternalLink } from "lucide-react";

export type TrustedSource = {
  name: string;
  /** Public homepage / area we cite from */
  url: string;
  /** Wikimedia Commons SVG (stable hot-link safe URL) */
  logo: string;
  /** Tier shown in the full section */
  tier: "International" | "Naija & Africa" | "Nutrition";
  /** Short description for the full section */
  cite: string;
};

export const TRUSTED_SOURCES: TrustedSource[] = [
  {
    name: "NIH MedlinePlus",
    url: "https://medlineplus.gov/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/NIH_Master_Logo_Vertical_2Color.png/240px-NIH_Master_Logo_Vertical_2Color.png",
    tier: "International",
    cite: "Plain-language explanations for every lab test we interpret.",
  },
  {
    name: "Mayo Clinic",
    url: "https://www.mayoclinic.org/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Mayo_Clinic_logo.svg/320px-Mayo_Clinic_logo.svg.png",
    tier: "International",
    cite: "Clinical condition references for cholesterol, diabetes, anaemia and more.",
  },
  {
    name: "World Health Organization",
    url: "https://www.who.int/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/WHO_logo.svg/320px-WHO_logo.svg.png",
    tier: "International",
    cite: "Global fact sheets on cardiovascular disease, diabetes, anaemia, HIV and TB.",
  },
  {
    name: "U.S. CDC",
    url: "https://www.cdc.gov/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/US_CDC_logo.svg/320px-US_CDC_logo.svg.png",
    tier: "International",
    cite: "Disease control guidance for malaria, HIV and infectious panels.",
  },
  {
    name: "USDA FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/USDA_logo.svg/320px-USDA_logo.svg.png",
    tier: "Nutrition",
    cite: "Live nutrient lookup verifies every food we recommend in your diet plan.",
  },
  {
    name: "WHO Africa",
    url: "https://www.afro.who.int/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/WHO_logo.svg/320px-WHO_logo.svg.png",
    tier: "Naija & Africa",
    cite: "Region-specific guidance for diseases prevalent in sub-Saharan Africa.",
  },
  {
    name: "Africa CDC",
    url: "https://africacdc.org/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Africa_CDC_logo.png/320px-Africa_CDC_logo.png",
    tier: "Naija & Africa",
    cite: "Continental authority on infectious disease screening and prevention.",
  },
  {
    name: "Federal Ministry of Health, Nigeria",
    url: "https://www.health.gov.ng/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Coat_of_arms_of_Nigeria.svg/240px-Coat_of_arms_of_Nigeria.svg.png",
    tier: "Naija & Africa",
    cite: "National policy reference for clinical and dietary guidelines in Nigeria.",
  },
  {
    name: "Nigerian Heart Foundation",
    url: "https://nigerianheart.org/",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Coat_of_arms_of_Nigeria.svg/240px-Coat_of_arms_of_Nigeria.svg.png",
    tier: "Naija & Africa",
    cite: "Local authority for hypertension and cardiovascular guidance.",
  },
];

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

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-6 items-center">
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
              className="group flex items-center justify-center h-12 sm:h-14"
              title={`${s.name} — opens in new tab`}
              aria-label={s.name}
            >
              <img
                src={s.logo}
                alt={`${s.name} logo`}
                loading="lazy"
                className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition duration-300"
              />
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
                      <div className="h-10 flex items-center">
                        <img
                          src={s.logo}
                          alt={`${s.name} logo`}
                          loading="lazy"
                          className="max-h-10 max-w-[140px] object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition duration-300"
                        />
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" aria-hidden />
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
            <span className="font-semibold text-foreground">A note on the logos above: </span>
            All trademarks, names and logos are the property of their respective owners.
            VeriDIA references their publicly available guidelines and lab-test pages —
            we are not affiliated with, endorsed by, or sponsored by any of these organisations.
            Every result you see in the app links directly to its specific source page so you can verify it yourself.
          </p>
        </div>
      </div>
    </section>
  );
};
