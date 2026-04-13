import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Leaf, Upload, Brain, Utensils, UserPlus, ShieldCheck, AlertTriangle,
  ClipboardList, Star, ChevronRight, Heart, Lock, Trash2
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary font-['Plus_Jakarta_Sans']">BioGuide</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <Button onClick={goAuth} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Heart className="w-4 h-4" /> Helping Nigerians take control of their health
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Understand Your Lab Results.{" "}
              <span className="text-accent">Eat Right</span> for Your Body.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Upload your lab result and get a personalized Nigerian diet plan powered by AI. No jargon, just clear guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={goAuth} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold px-8">
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -top-8 -right-8 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/15 blur-2xl" />
            <div className="relative space-y-4">
              <FloatingCard className="ml-8 animate-[float_6s_ease-in-out_infinite]" icon={<AlertTriangle className="w-5 h-5 text-destructive" />} text="Your cholesterol is high" sub="Total: 280 mg/dL" />
              <FloatingCard className="ml-0 animate-[float_6s_ease-in-out_infinite_1s]" icon={<Utensils className="w-5 h-5 text-secondary" />} text="Try more Oats & Garden Egg" sub="Lowers LDL naturally" />
              <FloatingCard className="ml-12 animate-[float_6s_ease-in-out_infinite_2s]" icon={<Leaf className="w-5 h-5 text-primary" />} text="Ugu leaf is rich in iron" sub="Great for your hemoglobin" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold">Four Simple Steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: UserPlus, title: "Sign Up", desc: "Create your free account in seconds" },
              { icon: Upload, title: "Upload Lab Result", desc: "Snap or upload your lab result (image or PDF)" },
              { icon: Brain, title: "Get AI Interpretation", desc: "Understand every biomarker in plain English" },
              { icon: Utensils, title: "Receive Your Diet Plan", desc: "Nigerian foods mapped to your specific needs" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for Nigerian Health Needs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: "Nigerian Food Intelligence", desc: "Localized advice using foods from your region — Ugu, Ofada rice, Garden Egg, and more.", color: "text-primary" },
              { icon: AlertTriangle, title: "Emergency Safety Alerts", desc: "Critical values are flagged immediately with doctor contact guidance.", color: "text-destructive" },
              { icon: ClipboardList, title: "Doctor Visit Checklist", desc: "Personalized questions to bring to your next appointment.", color: "text-accent" },
            ].map((f, i) => (
              <Card key={i} className="text-left border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
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

      {/* Trust Bar */}
      <section className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: ShieldCheck, title: "NDPA 2023 Compliant", desc: "Your data is handled in accordance with Nigeria's Data Protection Act" },
            { icon: Lock, title: "Your Data is Confidential", desc: "End-to-end encryption and strict access controls" },
            { icon: Trash2, title: "Data Minimization", desc: "Lab images are deleted after processing — we only keep your results" },
          ].map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <t.icon className="w-8 h-8 opacity-80" />
              <h3 className="font-bold">{t.title}</h3>
              <p className="text-sm opacity-80">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold">What Users Are Saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Adaeze O.", city: "Lagos", quote: "I finally understand what my lab results mean. The diet plan with local foods made it so practical!" },
              { name: "Ibrahim M.", city: "Abuja", quote: "The emergency alert saved me — I didn't know my potassium was critically high until BioGuide flagged it." },
              { name: "Folake A.", city: "Ibadan", quote: "I love the doctor checklist. I walked into my appointment feeling confident and prepared." },
              { name: "Chidi E.", city: "Port Harcourt", quote: "No more confusing medical jargon. BioGuide explains everything in a way I can actually use." },
            ].map((t, i) => (
              <Card key={i} className={`text-left border-0 shadow-sm ${i === 3 ? "md:col-span-3 md:max-w-md md:mx-auto" : ""}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
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

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Accessing better nutrition shouldn't be hard.{" "}
            <span className="text-accent">Let's make it easy.</span>
          </h2>
          <Button onClick={goAuth} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold px-8">
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
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

const FloatingCard = ({ icon, text, sub, className = "" }: { icon: React.ReactNode; text: string; sub: string; className?: string }) => (
  <div className={`bg-card rounded-xl shadow-lg border p-4 flex items-center gap-3 max-w-xs ${className}`}>
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="font-semibold text-sm">{text}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  </div>
);

export default Landing;
