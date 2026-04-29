import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Leaf, Upload, Brain, Utensils, UserPlus, ShieldCheck, AlertTriangle,
  ClipboardList, Star, ChevronRight, Heart, Lock, Trash2, Menu, X,
  Users, Baby, Activity, Stethoscope, HeartPulse, ArrowRight, Sparkles, CheckCircle2
} from "lucide-react";
import veridiaLogo from "@/assets/veridia-logo.png";
import { Aurora } from "@/components/Aurora";
import { CountUp } from "@/components/CountUp";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ── Animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16 md:h-20">
          <div className="flex items-center gap-2">
            <img src={veridiaLogo} alt="VeriDIA" className="h-12 sm:h-14 md:h-16 w-auto drop-shadow-md" />
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#who-its-for" className="hover:text-foreground transition-colors">Who It's For</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
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

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t bg-background px-4 pb-4 space-y-3 pt-3"
          >
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
          </motion.div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        {/* Surreal aurora backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <Aurora tone="brand" intensity={0.7} />
        </div>
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-3xl mx-auto text-center space-y-7 relative"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary animate-breathe">
            <Sparkles className="w-4 h-4" /> AI-powered • For Nigerians, by Nigerians
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight"
          >
            Turn Lab Results Into{" "}
            <span className="relative inline-block">
              <span className="text-shimmer">Life-Saving</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <motion.path
                  d="M2 6C50 2 150 2 198 6"
                  stroke="hsl(var(--accent))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.55"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.7, ease: [0.65, 0, 0.35, 1] }}
                />
              </svg>
            </span>{" "}
            Action.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Confused by your lab report? VeriDIA translates clinical numbers into plain English and culturally-grounded Nigerian dietary plans.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={goAuth}
              size="lg"
              className="bg-gradient-brand text-primary-foreground hover:opacity-95 text-base font-semibold px-10 rounded-full h-13 shadow-glow-primary border-0 transition-all hover:scale-[1.02] animate-subtle-pulse"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2.5">
              {avatars.map((a, i) => (
                <div key={i} className={`w-9 h-9 rounded-full ${a.bg} ${a.fg} flex items-center justify-center text-xs font-bold ring-2 ring-background`}>
                  {a.initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">500+ Users</p>
              <p className="text-xs text-muted-foreground">Taking control of their health</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2, delayChildren: 0.6 } } }}
          className="max-w-md mx-auto mt-12 space-y-3 md:max-w-2xl md:grid md:grid-cols-3 md:space-y-0 md:gap-4"
        >
          <motion.div variants={scaleIn}>
            <FloatingCard
              className="animate-[float_6s_ease-in-out_infinite]"
              icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
              text="Your cholesterol is high"
              sub="Total: 280 mg/dL"
              accent="border-l-destructive"
            />
          </motion.div>
          <motion.div variants={scaleIn}>
            <FloatingCard
              className="animate-[float_6s_ease-in-out_infinite_1s]"
              icon={<Utensils className="w-5 h-5 text-secondary" />}
              text="Try more Oats & Garden Egg"
              sub="Lowers LDL naturally"
              accent="border-l-secondary"
            />
          </motion.div>
          <motion.div variants={scaleIn}>
            <FloatingCard
              className="animate-[float_6s_ease-in-out_infinite_2s]"
              icon={<Leaf className="w-5 h-5 text-primary" />}
              text="Ugu leaf is rich in iron"
              sub="Great for your hemoglobin"
              accent="border-l-primary"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Real People. Real Results. ═══ */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-gradient-to-b from-background to-card/40">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <Aurora tone="brand" intensity={0.4} />
        </div>

        <AnimatedSection className="relative max-w-6xl mx-auto space-y-14">
          <motion.div variants={fadeUp} className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-foreground">Real People. Real Results.</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              From confusing lab numbers<br className="hidden sm:block" /> to calm, clear action.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg pt-2">
              Every day, Nigerian families turn worry into a plan they can actually follow. Here's how it sounds.
            </p>
          </motion.div>

          {/* Constellation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
            {[
              {
                name: "Aunty Bisi",
                role: "Caregiver, Lagos",
                Icon: Users,
                halo: "bg-destructive/15",
                ring: "ring-destructive/30",
                iconColor: "text-destructive",
                worry: "Mum's BP is 240/120. What now?",
                reply: "Critical. Call her doctor today. Cut salt; add ugu and watermelon.",
                tilt: "-rotate-2",
                replyTilt: "rotate-1",
              },
              {
                name: "Mr. Adekunle",
                role: "Living with diabetes",
                Icon: Activity,
                halo: "bg-primary/15",
                ring: "ring-primary/30",
                iconColor: "text-primary",
                worry: "HbA1c 8.2 — is that bad?",
                reply: "High. Swap white rice for ofada. Walk 20 min daily.",
                tilt: "rotate-2",
                replyTilt: "-rotate-1",
              },
              {
                name: "Chioma",
                role: "New mum, Enugu",
                Icon: Baby,
                halo: "bg-secondary/15",
                ring: "ring-secondary/30",
                iconColor: "text-secondary",
                worry: "Iron 9.1 and I feel weak.",
                reply: "Low. Add ugu, liver, and beans this week.",
                tilt: "-rotate-1",
                replyTilt: "rotate-2",
              },
              {
                name: "Tunde",
                role: "Health-conscious, Abuja",
                Icon: HeartPulse,
                halo: "bg-accent/15",
                ring: "ring-accent/30",
                iconColor: "text-secondary-foreground",
                worry: "Cholesterol 280 — am I in trouble?",
                reply: "High. Try oats and garden egg. Recheck in 8 weeks.",
                tilt: "rotate-1",
                replyTilt: "-rotate-2",
              },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-4">
                {/* Worry bubble */}
                <motion.div
                  variants={fadeUp}
                  className={`bg-card border rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 text-sm text-muted-foreground max-w-[220px] ${p.tilt}`}
                >
                  <p className="leading-snug">"{p.worry}"</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-medium">— {p.name}</p>
                </motion.div>

                {/* Connector */}
                <svg className="w-12 h-6 text-muted-foreground/30" viewBox="0 0 48 24" fill="none" aria-hidden>
                  <motion.path
                    d="M4 4 Q 24 24 44 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="3 4"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }}
                  />
                </svg>

                {/* Portrait halo */}
                <motion.div
                  variants={scaleIn}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ${p.halo} ring-4 ${p.ring} flex items-center justify-center group transition-transform hover:scale-105`}
                >
                  <p.Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${p.iconColor}`} strokeWidth={1.6} />
                  <span aria-hidden className="absolute -inset-1 rounded-full ring-1 ring-foreground/5" />
                </motion.div>

                <p className="text-xs font-medium text-muted-foreground -mt-1">{p.role}</p>

                {/* Reply bubble */}
                <motion.div
                  variants={fadeUp}
                  className={`relative bg-gradient-brand-soft border border-primary/20 rounded-2xl rounded-tr-sm shadow-sm px-4 py-3 text-sm text-foreground max-w-[240px] ${p.replyTilt}`}
                >
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-primary" aria-hidden />
                  <div className="flex items-start gap-2 pl-1.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="leading-snug font-medium">{p.reply}</p>
                  </div>
                  <p className="text-[11px] text-primary/80 mt-1.5 font-semibold pl-6">— VeriDIA</p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* CTA + social proof */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-5 pt-4">
            <Button
              onClick={goAuth}
              size="lg"
              className="bg-gradient-brand text-primary-foreground hover:opacity-95 text-base font-semibold px-10 rounded-full h-13 shadow-glow-primary border-0 transition-all hover:scale-[1.02]"
            >
              Get your plan free <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {avatars.map((a, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${a.bg} ${a.fg} flex items-center justify-center text-[11px] font-bold ring-2 ring-background`}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by <span className="font-semibold text-foreground">500+ Nigerian families</span>
              </p>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <AnimatedSection className="py-10 px-4 border-y bg-card">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { to: 500, suffix: "+", label: "Active Users" },
            { to: 50,  suffix: "+", label: "Biomarkers Tracked" },
            { to: 6,   suffix: "",  label: "Nigerian Zones" },
            { to: 100, suffix: "%", label: "NDPA Compliant" },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeUp}>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                <CountUp to={stat.to} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 scroll-mt-20">
        <AnimatedSection className="max-w-5xl mx-auto space-y-12">
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-foreground">How It Works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">From lab result to diet plan<br className="hidden sm:block" /> in minutes</h2>
            <p className="text-muted-foreground max-w-md mx-auto">No medical degree needed. Just upload, and we handle the rest.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, title: "Sign Up", desc: "Create your free account in seconds", bg: "bg-primary/10", color: "text-primary", step: "01" },
              { icon: Upload, title: "Upload Lab Result", desc: "Snap or upload your result — image or PDF", bg: "bg-accent/10", color: "text-accent", step: "02" },
              { icon: Brain, title: "AI Interpretation", desc: "Every biomarker explained in plain English", bg: "bg-secondary/10", color: "text-secondary", step: "03" },
              { icon: Utensils, title: "Get Your Diet Plan", desc: "Nigerian foods mapped to your specific needs", bg: "bg-destructive/10", color: "text-destructive", step: "04" },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <step.icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <span className="text-3xl font-extrabold text-muted/40 font-display">{step.step}</span>
                    </div>
                    <h3 className="font-bold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ Who It's For ═══ */}
      <section id="who-its-for" className="py-20 md:py-28 px-4 bg-card scroll-mt-20">
        <AnimatedSection className="max-w-5xl mx-auto space-y-12">
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Who It's For</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Built for every Nigerian<br className="hidden sm:block" /> who cares about health</h2>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Caregivers", icon: Users },
              { label: "New Parents", icon: Baby },
              { label: "Diabetics", icon: Activity },
              { label: "Health-Conscious", icon: HeartPulse },
              { label: "Elderly Care", icon: Stethoscope },
            ].map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors cursor-default">
                <p.icon className="w-4 h-4" /> {p.label}
              </span>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "For You",
                bg: "bg-accent/10", color: "text-accent", borderColor: "hover:border-accent/30",
                icon: Heart,
                points: ["Understand your own lab results", "Get a diet plan with foods you know", "Track your health over time"],
              },
              {
                title: "For Your Parents",
                bg: "bg-primary/10", color: "text-primary", borderColor: "hover:border-primary/30",
                icon: Users,
                points: ["Help aging parents understand their results", "Share clear reports with their doctor", "Prevent emergencies with critical alerts"],
              },
              {
                title: "For Your Family",
                bg: "bg-secondary/10", color: "text-secondary", borderColor: "hover:border-secondary/30",
                icon: HeartPulse,
                points: ["Manage chronic conditions confidently", "Make informed food choices as a family", "Stay on top of regular checkups"],
              },
            ].map((c, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`border shadow-sm hover:shadow-lg transition-all duration-300 ${c.borderColor} h-full`}>
                  <CardContent className="p-6 space-y-5">
                    <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center`}>
                      <c.icon className={`w-7 h-7 ${c.color}`} />
                    </div>
                    <h3 className="font-bold text-xl">{c.title}</h3>
                    <ul className="space-y-3">
                      {c.points.map((pt, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-20 md:py-28 px-4 scroll-mt-20">
        <AnimatedSection className="max-w-5xl mx-auto space-y-12">
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Built for Nigerian<br className="hidden sm:block" /> Health Needs</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: "Nigerian Food Intelligence", desc: "Localized advice using foods from your region — Ugu, Ofada rice, Garden Egg, and more.", color: "text-primary", bg: "bg-primary/10", borderColor: "hover:border-primary/30" },
              { icon: AlertTriangle, title: "Emergency Safety Alerts", desc: "Critical values are flagged immediately with doctor contact guidance.", color: "text-destructive", bg: "bg-destructive/10", borderColor: "hover:border-destructive/30" },
              { icon: ClipboardList, title: "Doctor Visit Checklist", desc: "Personalized questions to bring to your next appointment.", color: "text-accent", bg: "bg-accent/10", borderColor: "hover:border-accent/30" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`text-left border shadow-sm hover:shadow-lg transition-all duration-300 group ${f.borderColor} h-full`}>
                  <CardContent className="p-7 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <f.icon className={`w-7 h-7 ${f.color}`} />
                    </div>
                    <h3 className="font-bold text-xl">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ Social Proof Bubbles ═══ */}
      <section className="py-20 md:py-28 px-4 bg-card">
        <AnimatedSection className="max-w-4xl mx-auto text-center space-y-12">
          <motion.div variants={fadeUp}>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Real Stories</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Nigerians are taking charge<br className="hidden sm:block" /> of their health</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { initials: "AO", name: "Adaeze O.", color: "bg-primary", fg: "text-primary-foreground", quote: "My cholesterol dropped after following the diet plan for 3 months!" },
              { initials: "IM", name: "Ibrahim M.", color: "bg-accent", fg: "text-accent-foreground", quote: "I finally understand what my lab results actually mean." },
              { initials: "FA", name: "Folake A.", color: "bg-secondary", fg: "text-secondary-foreground", quote: "The diet plan with local foods made it so practical and affordable." },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${t.color} ${t.fg} flex items-center justify-center text-lg font-bold shadow-lg`}>
                  {t.initials}
                </div>
                <div className="relative bg-muted rounded-2xl px-5 py-4 text-sm text-muted-foreground max-w-xs">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-muted rotate-45 rounded-sm" />
                  <span className="relative italic leading-relaxed">"{t.quote}"</span>
                </div>
                <p className="font-semibold text-sm">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ Compliance & Trust ═══ */}
      <section className="py-20 md:py-28 px-4">
        <AnimatedSection className="max-w-4xl mx-auto text-center space-y-12">
          <motion.div variants={fadeUp} className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Trust & Security</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-2xl mx-auto">
              Your data is protected by the highest standards
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "NDPA 2023 Compliant", desc: "Your data is handled in accordance with Nigeria's Data Protection Act" },
              { icon: Lock, title: "Your Data is Confidential", desc: "End-to-end encryption and strict access controls" },
              { icon: Trash2, title: "Data Minimization", desc: "Lab images are deleted after processing — we only keep your results" },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-4 p-6 rounded-2xl hover:bg-muted/50 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <t.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section id="testimonials" className="py-20 md:py-28 px-4 bg-card scroll-mt-20">
        <AnimatedSection className="max-w-5xl mx-auto text-center space-y-12">
          <motion.div variants={fadeUp}>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">What Users Are Saying</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Adaeze O.", city: "Lagos", quote: "I finally understand what my lab results mean. The diet plan with local foods made it so practical!" },
              { name: "Ibrahim M.", city: "Abuja", quote: "The emergency alert saved me — I didn't know my potassium was critically high until VeriDIA flagged it." },
              { name: "Folake A.", city: "Ibadan", quote: "I love the doctor checklist. I walked into my appointment feeling confident and prepared." },
              { name: "Chidi E.", city: "Port Harcourt", quote: "No more confusing medical jargon. VeriDIA explains everything in a way I can actually use." },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="text-left border shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.city}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="relative py-20 md:py-28 px-4 bg-primary text-primary-foreground overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-primary-foreground" />
          <div className="absolute top-20 right-16 w-20 h-20 rounded-full border border-primary-foreground" />
          <div className="absolute bottom-10 left-1/4 w-16 h-16 rounded-full bg-primary-foreground/10" />
          <div className="absolute bottom-16 right-1/3 w-24 h-24 rounded-full border border-primary-foreground" />
        </div>

        <AnimatedSection className="max-w-3xl mx-auto text-center space-y-7 relative">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Accessing better nutrition shouldn't be hard.{" "}
            <span className="text-accent">Let's make it easy.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-primary-foreground/80 max-w-lg mx-auto text-lg">
            Join 500+ Nigerians already using VeriDIA to understand their health and eat better.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button
              onClick={goAuth}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-base font-semibold px-10 rounded-full h-13 shadow-2xl transition-all hover:scale-[1.02] animate-breathe"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={veridiaLogo} alt="VeriDIA" className="h-12 md:h-14 w-auto drop-shadow-md" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            VeriDIA is not a substitute for professional medical advice. Always consult a qualified healthcare provider.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">© {new Date().getFullYear()} VeriDIA. All rights reserved.</p>
      </footer>
    </div>
  );
};

/* ── Reusable floating card ── */
const FloatingCard = ({ icon, text, sub, className = "", accent = "" }: { icon: React.ReactNode; text: string; sub: string; className?: string; accent?: string }) => (
  <div className={`relative bg-card rounded-xl shadow-card border overflow-hidden p-4 flex items-center gap-3 ${className}`}>
    <span className={`absolute left-0 top-0 bottom-0 w-1 ${accent.replace("border-l-", "bg-")}`} />
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="font-semibold text-sm">{text}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  </div>
);

export default Landing;
