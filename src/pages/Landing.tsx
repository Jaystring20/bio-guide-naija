import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Leaf, Upload, Brain, Utensils, UserPlus, ShieldCheck, AlertTriangle,
  ClipboardList, Star, ChevronRight, Heart, Lock, Trash2, Menu, X,
  Users, Baby, Activity, Stethoscope, HeartPulse
} from "lucide-react";

/* ── Avatars ── */
const avatars = [
  { initials: "AO", bg: "bg-primary", fg: "text-primary-foreground" },
  { initials: "IM", bg: "bg-accent", fg: "text-accent-foreground" },
  { initials: "FA", bg: "bg-secondary", fg: "text-secondary-foreground" },
  { initials: "CE", bg: "bg-destructive", fg: "text-destructive-foreground" },
  { initials: "NB", bg: "bg-primary", fg: "text-primary-foreground" },
];

const Landing = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary font-['Plus_Jakarta_Sans']">BioGuide</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#who-its-for" className="hover:text-foreground transition-colors">Who It's For</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={goAuth} className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-full px-6">
              Get Started
            </Button>
            <button
              className="md:hidden touch-target flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-background px-4 pb-4 space-y-3 pt-3 animate-in slide-in-from-top-2">
            {[
              ["#how-it-works", "How It Works"],
              ["#who-its-for", "Who It's For"],
              ["#features", "Features"],
              ["#testimonials", "Testimonials"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-foreground py-2"
              >
                {label}
              </a>
            ))}
            <Button onClick={goAuth} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-full">
              Get Started Free
            </Button>
          </div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="py-16 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="w-4 h-4" /> For Nigerians, by Nigerians
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Understand Your Lab Results.{" "}
            <span className="text-accent">Eat Right</span> for Your Body.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Upload your lab result and get a personalized Nigerian diet plan powered by AI. No jargon — just clear guidance you can act on today.
          </p>

          <Button
            onClick={goAuth}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold px-10 rounded-full h-12"
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {avatars.map((a, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${a.bg} ${a.fg} flex items-center justify-center text-xs font-bold ring-2 ring-background`}>
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Helping <span className="font-semibold text-foreground">500+</span> Nigerians take control
            </p>
          </div>
        </div>

        {/* Floating cards — visible on all screens */}
        <div className="max-w-md mx-auto mt-10 space-y-3 md:max-w-2xl md:grid md:grid-cols-3 md:space-y-0 md:gap-4">
          <FloatingCard
            className="animate-[float_6s_ease-in-out_infinite]"
            icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
            text="Your cholesterol is high"
            sub="Total: 280 mg/dL"
          />
          <FloatingCard
            className="animate-[float_6s_ease-in-out_infinite_1s]"
            icon={<Utensils className="w-5 h-5 text-secondary" />}
            text="Try more Oats & Garden Egg"
            sub="Lowers LDL naturally"
          />
          <FloatingCard
            className="animate-[float_6s_ease-in-out_infinite_2s]"
            icon={<Leaf className="w-5 h-5 text-primary" />}
            text="Ugu leaf is rich in iron"
            sub="Great for your hemoglobin"
          />
        </div>
      </section>

      {/* ═══ Social Proof Bubbles ═══ */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Real Stories</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Nigerians are taking charge of their health</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { initials: "AO", color: "bg-primary", fg: "text-primary-foreground", quote: "My cholesterol dropped after following the diet plan for 3 months!" },
              { initials: "IM", color: "bg-accent", fg: "text-accent-foreground", quote: "I finally understand what my lab results actually mean." },
              { initials: "FA", color: "bg-secondary", fg: "text-secondary-foreground", quote: "The diet plan with local foods made it so practical and affordable." },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full ${t.color} ${t.fg} flex items-center justify-center text-lg font-bold`}>
                  {t.initials}
                </div>
                <div className="relative bg-muted rounded-2xl px-4 py-3 text-sm text-muted-foreground italic max-w-xs">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-muted rotate-45 rounded-sm" />
                  <span className="relative">"{t.quote}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">From lab result to diet plan in minutes</h2>
            <p className="text-muted-foreground mt-3">No medical degree needed. Just upload, and we handle the rest.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: UserPlus, title: "Sign Up", desc: "Create your free account in seconds", bg: "bg-primary/10", color: "text-primary" },
              { icon: Upload, title: "Upload Lab Result", desc: "Snap or upload your result — image or PDF", bg: "bg-accent/10", color: "text-accent" },
              { icon: Brain, title: "AI Interpretation", desc: "Every biomarker explained in plain English", bg: "bg-secondary/10", color: "text-secondary" },
              { icon: Utensils, title: "Get Your Diet Plan", desc: "Nigerian foods mapped to your specific needs", bg: "bg-destructive/10", color: "text-destructive" },
            ].map((step, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <h3 className="font-bold text-base">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Who It's For ═══ */}
      <section id="who-its-for" className="py-16 md:py-20 px-4 bg-card scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Who It's For</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Built for every Nigerian who cares about health</h2>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Caregivers", icon: Users },
              { label: "New Parents", icon: Baby },
              { label: "Diabetics", icon: Activity },
              { label: "Health-Conscious", icon: HeartPulse },
              { label: "Elderly Care", icon: Stethoscope },
            ].map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground">
                <p.icon className="w-4 h-4" /> {p.label}
              </span>
            ))}
          </div>

          {/* Benefit cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "For You",
                bg: "bg-accent/10", color: "text-accent",
                icon: Heart,
                points: ["Understand your own lab results", "Get a diet plan with foods you know", "Track your health over time"],
              },
              {
                title: "For Your Parents",
                bg: "bg-primary/10", color: "text-primary",
                icon: Users,
                points: ["Help aging parents understand their results", "Share clear reports with their doctor", "Prevent emergencies with critical alerts"],
              },
              {
                title: "For Your Family",
                bg: "bg-secondary/10", color: "text-secondary",
                icon: HeartPulse,
                points: ["Manage chronic conditions confidently", "Make informed food choices as a family", "Stay on top of regular checkups"],
              },
            ].map((c, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <c.icon className={`w-6 h-6 ${c.color}`} />
                  </div>
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  <ul className="space-y-2">
                    {c.points.map((pt, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Built for Nigerian Health Needs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: "Nigerian Food Intelligence", desc: "Localized advice using foods from your region — Ugu, Ofada rice, Garden Egg, and more.", color: "text-primary", bg: "bg-primary/10" },
              { icon: AlertTriangle, title: "Emergency Safety Alerts", desc: "Critical values are flagged immediately with doctor contact guidance.", color: "text-destructive", bg: "bg-destructive/10" },
              { icon: ClipboardList, title: "Doctor Visit Checklist", desc: "Personalized questions to bring to your next appointment.", color: "text-accent", bg: "bg-accent/10" },
            ].map((f, i) => (
              <Card key={i} className="text-left border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Compliance & Trust ═══ */}
      <section className="py-16 md:py-20 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
            Complies with the highest standards of quality and data security
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "NDPA 2023 Compliant", desc: "Your data is handled in accordance with Nigeria's Data Protection Act" },
              { icon: Lock, title: "Your Data is Confidential", desc: "End-to-end encryption and strict access controls" },
              { icon: Trash2, title: "Data Minimization", desc: "Lab images are deleted after processing — we only keep your results" },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-4 p-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <t.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section id="testimonials" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">What Users Are Saying</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Adaeze O.", city: "Lagos", quote: "I finally understand what my lab results mean. The diet plan with local foods made it so practical!" },
              { name: "Ibrahim M.", city: "Abuja", quote: "The emergency alert saved me — I didn't know my potassium was critically high until BioGuide flagged it." },
              { name: "Folake A.", city: "Ibadan", quote: "I love the doctor checklist. I walked into my appointment feeling confident and prepared." },
              { name: "Chidi E.", city: "PH", quote: "No more confusing medical jargon. BioGuide explains everything in a way I can actually use." },
            ].map((t, i) => (
              <Card key={i} className="text-left border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="relative py-16 md:py-20 px-4 bg-primary text-primary-foreground overflow-hidden">
        {/* Decorative avatar circles */}
        <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-accent/20 hidden md:block" />
        <div className="absolute top-16 right-12 w-8 h-8 rounded-full bg-secondary/20 hidden md:block" />
        <div className="absolute bottom-8 left-1/4 w-6 h-6 rounded-full bg-accent/15 hidden md:block" />
        <div className="absolute bottom-12 right-1/3 w-12 h-12 rounded-full bg-secondary/15 hidden md:block" />

        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Accessing better nutrition shouldn't be hard.{" "}
            <span className="text-accent">Let's make it easy.</span>
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto">
            Join 500+ Nigerians already using BioGuide to understand their health and eat better.
          </p>
          <Button
            onClick={goAuth}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold px-10 rounded-full h-12"
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">BioGuide</span>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            BioGuide is not a substitute for professional medical advice. Always consult a qualified healthcare provider.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Privacy</span>
            <span className="hover:text-foreground cursor-pointer">Terms</span>
            <span className="hover:text-foreground cursor-pointer">Contact</span>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">© {new Date().getFullYear()} BioGuide. All rights reserved.</p>
      </footer>
    </div>
  );
};

/* ── Reusable floating card ── */
const FloatingCard = ({ icon, text, sub, className = "" }: { icon: React.ReactNode; text: string; sub: string; className?: string }) => (
  <div className={`bg-card rounded-xl shadow-lg border p-4 flex items-center gap-3 ${className}`}>
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="font-semibold text-sm">{text}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  </div>
);

export default Landing;
