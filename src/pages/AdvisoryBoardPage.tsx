import { Link } from "react-router-dom";
import { ArrowLeft, Stethoscope, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VeridiaLogo } from "@/components/VeridiaLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  advisoryBoard,
  ADVISORY_BOARD_STATUS,
  boardResponsibilities,
} from "@/data/advisoryBoard";

const accentClass: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export default function AdvisoryBoardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO */}
      <title>Nutrition & Clinical Advisory Board | VeriDIA</title>
      <meta
        name="description"
        content="Meet the Nigerian endocrinologists, dietitians, and food scientists who review VeriDIA's clinical thresholds, diet plans, and local food guidance."
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-2">
            <VeridiaLogo className="h-12 sm:h-16 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-16">
        {/* Hero */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-semibold uppercase tracking-widest">
            <Stethoscope className="w-4 h-4" />
            Advisory Board
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Nutrition & Clinical Advisory Board
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A panel of Nigerian endocrinologists, registered dietitians, paediatricians, and
            food scientists who review VeriDIA's clinical logic, diet templates, and source
            material — so every report you read has expert oversight behind it.
          </p>
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-medium border border-amber-500/30">
            <ShieldCheck className="w-4 h-4" />
            {ADVISORY_BOARD_STATUS.label}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto pt-2">
            {ADVISORY_BOARD_STATUS.note}
          </p>
        </header>

        {/* Responsibilities */}
        <section className="rounded-3xl border bg-card p-6 sm:p-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">What the board does</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {boardResponsibilities.map((r) => (
              <div key={r.title} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Members */}
        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Members</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {advisoryBoard.map((m) => (
              <article
                key={m.id}
                className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl ${accentClass[m.accent]}`}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight">{m.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.credentials}</p>
                    <p className="text-sm font-semibold text-secondary-foreground mt-1.5">{m.title}</p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">{m.bio}</p>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Affiliation
                  </p>
                  <p className="text-sm">{m.affiliation}</p>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {m.location}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Areas of focus
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.focus.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">Important note</p>
          <p>
            VeriDIA's Advisory Board provides clinical and nutritional oversight of our methodology
            and content. The board does not see individual user data and does not provide
            personalised medical advice. Always consult your own physician or registered dietitian
            for decisions about your care.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Are you a Nigerian nutrition or clinical expert?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We're growing the board with practitioners who care about safe, culturally-grounded
            nutrition guidance. Reach out via the feedback form inside the app.
          </p>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/">Back to home</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
