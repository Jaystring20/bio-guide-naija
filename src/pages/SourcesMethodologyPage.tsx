/**
 * Sources & Methodology page
 *
 * Public, no-auth page that explains how VeriDIA selects, tiers and
 * cites medical and nutritional authorities. Linked from the landing
 * page (#our-sources → "Read the full methodology") and from in-app
 * Sources & Methodology accordions on lab reports.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Globe2,
  MapPin,
  Apple,
  Search,
  FileCheck2,
  Scale,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VeridiaLogo } from "@/components/VeridiaLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TRUSTED_SOURCES } from "@/components/landing/TrustedSources";
import {
  BIOMARKER_CATALOG,
  getBiomarkersForDomain,
} from "@/lib/medical-citations";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const TIER_META: Record<
  string,
  { icon: typeof Globe2; blurb: string }
> = {
  International: {
    icon: Globe2,
    blurb:
      "Globally recognised authorities your doctor learned from. We use these for the medical interpretation of every biomarker.",
  },
  "Naija & Africa": {
    icon: MapPin,
    blurb:
      "Region-specific authorities. We add these whenever guidance differs in sub-Saharan Africa — for example, malaria, sickle cell, hypertension, or local dietary patterns.",
  },
  Nutrition: {
    icon: Apple,
    blurb:
      "Live nutrient data behind every food we recommend. Each ingredient in your diet plan is verified against this database in real time.",
  },
};

const SourcesMethodologyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Highlight the targeted biomarker card briefly when arriving via #bio-{slug}
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    if (!hash.startsWith("bio-")) return;
    const slug = hash.slice("bio-".length);
    // Defer to next frame so the target element is mounted.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`bio-${slug}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightedSlug(slug);
        const t = window.setTimeout(() => setHighlightedSlug(null), 2200);
        return () => window.clearTimeout(t);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [location.hash, location.key]);

  // Group catalog by first letter for the alphabetical jump-bar
  const grouped = useMemo(() => {
    const map = new Map<string, typeof BIOMARKER_CATALOG>();
    [...BIOMARKER_CATALOG]
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((b) => {
        const letter = b.label.charAt(0).toUpperCase();
        if (!map.has(letter)) map.set(letter, []);
        map.get(letter)!.push(b);
      });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16 md:h-20">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
            aria-label="Back to home"
          >
            <VeridiaLogo className="h-12 sm:h-14 w-auto" />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-16">
        {/* ─── Hero ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/30 px-3 py-1 text-xs font-semibold text-secondary">
            <ShieldCheck className="w-3.5 h-3.5" /> Sources & Methodology
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            How we keep VeriDIA credible.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            VeriDIA uses AI to read your lab paper — but the AI is{" "}
            <strong className="text-foreground">never</strong> the source of the
            medical advice you see. Every biomarker explanation links to a
            curated, vetted medical authority, and every food we recommend is
            verified against a live nutrition database. This page explains
            exactly how that works.
          </p>
        </motion.section>

        {/* ─── The handshake ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="space-y-5"
        >
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> The "handshake"
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We split responsibilities between the AI and our verified sources so
            no single component can mislead you:
          </p>
          <ol className="space-y-4">
            {[
              {
                title: "AI reads your lab paper",
                body:
                  "Google Gemini extracts each biomarker name, value, and unit from your photo. It also drafts a plain-English explanation in English or Pidgin.",
              },
              {
                title: "We match each biomarker to a curated source",
                body:
                  "Every biomarker name (e.g. ALT, HbA1c, Ferritin) is matched against our vetted citation map. The URLs you see are never generated by the AI — they come from a static, human-reviewed list.",
              },
              {
                title: "We verify every food in your diet plan",
                body:
                  "Each ingredient is cross-checked live against USDA FoodData Central. If we can't verify it, we tag it so you know.",
              },
              {
                title: "We tag what's verified vs AI-only",
                body:
                  "Verified items get a green ✓ badge. Items the AI interpreted but we couldn't independently match get an amber ⚠ pill so you can treat them with extra caution.",
              },
            ].map((step, i) => (
              <li
                key={i}
                className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* ─── Selection criteria ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="space-y-5"
        >
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> How we select a source
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A source only enters our citation map if it meets all four
            criteria:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: ShieldCheck,
                title: "Public & official",
                body: "A government health agency, WHO body, accredited teaching hospital, or peer-reviewed reference. No blogs, no listicles.",
              },
              {
                icon: FileCheck2,
                title: "Stable URL",
                body: "The page must have a long-lived URL we can link to without breaking. We re-check links periodically.",
              },
              {
                icon: Scale,
                title: "Plain-language",
                body: "Where possible, we link to the patient-facing version (e.g. NIH MedlinePlus) rather than a research paper.",
              },
              {
                icon: MapPin,
                title: "Relevant to Nigeria",
                body: "For tropical or genetic conditions (malaria, sickle cell, G6PD) we prefer regional authorities like WHO Africa or FMOH.",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4 space-y-2"
              >
                <c.icon className="w-5 h-5 text-secondary" />
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── Tiers ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="space-y-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold">
            How we tier each source
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We group sources into three tiers and surface them together on every
            lab report so you can see exactly who agrees on the interpretation.
          </p>

          <div className="space-y-8">
            {(["International", "Naija & Africa", "Nutrition"] as const).map(
              (tier) => {
                const meta = TIER_META[tier];
                const Icon = meta.icon;
                const items = TRUSTED_SOURCES.filter((s) => s.tier === tier);
                return (
                  <div key={tier} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-lg">{tier}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {meta.blurb}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 sm:pl-13">
                      {items.map((s) => {
                        const linkedBiomarkers = s.domain
                          ? getBiomarkersForDomain(s.domain)
                          : [];
                        const previewCount = 6;
                        const preview = linkedBiomarkers.slice(0, previewCount);
                        const remaining =
                          linkedBiomarkers.length - preview.length;

                        return (
                          <li
                            key={s.name}
                            className="bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group h-9 w-20 flex items-center justify-center flex-shrink-0"
                                aria-label={`Visit ${s.name}`}
                              >
                                <img
                                  src={s.logo}
                                  alt={`${s.name} logo`}
                                  loading="lazy"
                                  className="max-h-9 max-w-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition"
                                />
                              </a>
                              <div className="flex-1 min-w-0 space-y-1">
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-1.5 font-semibold text-sm hover:text-primary transition-colors"
                                >
                                  {s.name}
                                  <ExternalLink className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                                </a>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {s.cite}
                                </p>
                                {preview.length > 0 && (
                                  <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                                      Used in:
                                    </span>
                                    {preview.map((b) => (
                                      <a
                                        key={b.slug}
                                        href={`#bio-${b.slug}`}
                                        className="inline-flex items-center text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 transition-colors"
                                      >
                                        {b.label}
                                      </a>
                                    ))}
                                    {remaining > 0 && (
                                      <a
                                        href="#biomarker-library"
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        +{remaining} more →
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }
            )}
          </div>
        </motion.section>

        {/* ─── Biomarker Reference Library (deep-link targets) ─── */}
        <motion.section
          id="biomarker-library"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={fadeUp}
          className="space-y-6 scroll-mt-24"
        >
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Biomarker Reference Library
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every curated biomarker we cite, with direct links to its sources.
              Each entry has its own anchor — share{" "}
              <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground">
                /sources#bio-hba1c
              </code>{" "}
              to point someone to a specific reference.
            </p>
          </div>

          {/* Alphabetical jump-bar */}
          <nav
            aria-label="Jump to biomarkers by letter"
            className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-card border border-border sticky top-16 md:top-20 z-30"
          >
            {grouped.map(([letter]) => (
              <a
                key={letter}
                href={`#bio-letter-${letter}`}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {letter}
              </a>
            ))}
          </nav>

          {/* Letter groups */}
          <div className="space-y-8">
            {grouped.map(([letter, entries]) => (
              <div key={letter} className="space-y-3">
                <h3
                  id={`bio-letter-${letter}`}
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 scroll-mt-32"
                >
                  {letter}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entries.map((b) => {
                    const isHighlighted = highlightedSlug === b.slug;
                    return (
                      <article
                        key={b.slug}
                        id={`bio-${b.slug}`}
                        className={cn(
                          "scroll-mt-32 bg-card border border-border rounded-xl p-4 space-y-2 transition-all duration-500",
                          isHighlighted &&
                            "ring-2 ring-primary/60 border-primary/40 shadow-md"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground">
                            {b.label}
                          </h4>
                          <a
                            href={`#bio-${b.slug}`}
                            className="text-[10px] text-muted-foreground/60 hover:text-primary font-mono transition-colors"
                            aria-label={`Permalink to ${b.label}`}
                            title="Copy link to this biomarker"
                          >
                            #
                          </a>
                        </div>
                        <ul className="space-y-1">
                          {b.citations.map((c, i) => (
                            <li key={i}>
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-start gap-1.5 text-xs text-primary hover:underline leading-relaxed"
                              >
                                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                                <span>
                                  <span className="font-medium text-muted-foreground">
                                    {c.domain}:
                                  </span>{" "}
                                  <span className="text-foreground group-hover:text-primary transition-colors">
                                    {c.title}
                                  </span>
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Showing {BIOMARKER_CATALOG.length} curated biomarkers. New entries
            are added regularly as we expand coverage.
          </p>
        </motion.section>

        {/* ─── Verification badges legend ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="space-y-5"
        >
          <h2 className="text-xl sm:text-2xl font-bold">
            What the badges on your report mean
          </h2>
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 text-xs font-semibold flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cross-checked
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We have a curated, biomarker-specific source from one of the
                authorities above. The link in the report goes directly to that
                page so you can verify it yourself.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--alert-amber))]/10 text-[hsl(var(--alert-amber))] border border-[hsl(var(--alert-amber))]/30 px-2.5 py-1 text-xs font-semibold flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" /> AI only
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The AI interpretation is shown but we don't yet have a curated,
                biomarker-specific source for it. Treat the explanation with
                extra caution and confirm with your doctor.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30 px-2.5 py-1 text-xs font-semibold flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> USDA verified
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This food's nutrient profile was looked up live in USDA
                FoodData Central while building your diet plan.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ─── What we don't claim ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="space-y-5"
        >
          <h2 className="text-xl sm:text-2xl font-bold">
            What we don't claim
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {[
              "VeriDIA is not a substitute for medical advice. Always speak to a qualified clinician for diagnosis and treatment.",
              "We are not affiliated with, endorsed by, or sponsored by any of the organisations whose logos appear on our site.",
              "Logos and trademarks are the property of their respective owners and are shown solely to credit the public guidelines we cite.",
              "Our citation map is reviewed and expanded regularly — if a source ever moves or retires, we update the link as soon as we notice.",
            ].map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-secondary mt-0.5">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* ─── CTA ─── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-gradient-brand-soft border border-primary/20 rounded-2xl p-6 sm:p-8 text-center space-y-4"
        >
          <h2 className="text-xl sm:text-2xl font-bold">
            Ready to see it on your own results?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Upload a lab report and watch every biomarker link back to a source
            you can verify yourself.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-brand text-primary-foreground hover:opacity-95 font-semibold rounded-full px-8"
          >
            Get Started Free
          </Button>
        </motion.section>

        {/* Footer link */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
      </main>
    </div>
  );
};

export default SourcesMethodologyPage;
