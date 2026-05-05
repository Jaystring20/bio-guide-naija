import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, User, ShieldCheck, Heart, Stethoscope, UserCheck } from "lucide-react";
import { VeridiaLogo } from "@/components/VeridiaLogo";

const ZONES = [
  { value: "south-south", label: "South-South", desc: "Rivers, Bayelsa, Delta, Edo, Akwa Ibom, Cross River" },
  { value: "south-west", label: "South-West", desc: "Lagos, Ogun, Oyo, Osun, Ondo, Ekiti" },
  { value: "south-east", label: "South-East", desc: "Anambra, Enugu, Imo, Abia, Ebonyi" },
  { value: "north-central", label: "North-Central", desc: "Abuja, Niger, Benue, Plateau, Kwara, Kogi, Nasarawa" },
  { value: "north-east", label: "North-East", desc: "Borno, Yobe, Adamawa, Bauchi, Gombe, Taraba" },
  { value: "north-west", label: "North-West", desc: "Kano, Kaduna, Katsina, Zamfara, Sokoto, Kebbi, Jigawa" },
];

const ROLES = [
  { value: "personal", label: "For myself", desc: "Track my own health", icon: UserCheck },
  { value: "caregiver", label: "I'm a caregiver", desc: "Managing health for family members", icon: Heart },
  { value: "professional", label: "Health professional", desc: "Track results for my patients", icon: Stethoscope },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [zone, setZone] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      await updateProfile({
        user_role: role || "personal",
        geopolitical_zone: zone as any,
        age: parseInt(age),
        sex: sex as any,
        phone: phone.trim() || null,
        ndpa_consent: consent,
        medical_disclaimer_accepted: true,
        onboarding_completed: true,
      } as any);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const screens = [
    // Welcome
    <div key="welcome" className="flex flex-col items-center text-center animate-slide-up">
      <VeridiaLogo className="h-40 sm:h-48 w-auto mb-6 drop-shadow-md" />
      <h1 className="font-display text-3xl font-bold text-secondary mb-3">Welcome to VeriDIA</h1>
      <p className="text-muted-foreground text-body max-w-xs mb-2">
        Your personal lab-to-nutrition companion — built for Nigerians, by Nigerians.
      </p>
      <p className="text-muted-foreground text-body-sm max-w-xs">
        We'll help you understand your lab results and create a diet plan using foods you already know and love.
      </p>
    </div>,

    // Role selection
    <div key="role" className="w-full animate-slide-up">
      <h2 className="font-display text-2xl font-bold mb-2">How will you use VeriDIA?</h2>
      <p className="text-muted-foreground mb-6 text-body-sm">
        This helps us tailor the experience for you.
      </p>
      <div className="space-y-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all touch-target flex items-center gap-4 ${
                role === r.value
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card"
              }`}
            >
              <Icon className={`w-6 h-6 flex-shrink-0 ${role === r.value ? "text-secondary-foreground" : "text-secondary"}`} />
              <div>
                <p className="font-semibold text-body">{r.label}</p>
                <p className="text-body-sm text-muted-foreground">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // Region
    <div key="region" className="w-full animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-secondary-foreground" />
        <h2 className="font-display text-2xl font-bold">Where are you from?</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        This helps us recommend foods available in your local market.
      </p>
      <div className="space-y-3">
        {ZONES.map((z) => (
          <button
            key={z.value}
            onClick={() => setZone(z.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all touch-target ${
              zone === z.value
                ? "border-accent bg-accent/10"
                : "border-border bg-card"
            }`}
          >
            <p className="font-semibold text-body">{z.label}</p>
            <p className="text-body-sm text-muted-foreground">{z.desc}</p>
          </button>
        ))}
      </div>
    </div>,

    // Profile + Consent
    <div key="profile" className="w-full animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-secondary-foreground" />
        <h2 className="font-display text-2xl font-bold">Tell us about you</h2>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-body-sm font-medium mb-1 block">Age</label>
          <Input
            type="number"
            placeholder="e.g. 42"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="h-14 text-body rounded-xl"
          />
        </div>
        <div>
          <label className="text-body-sm font-medium mb-2 block">Sex</label>
          <div className="flex gap-3">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`flex-1 h-14 rounded-xl border-2 font-semibold text-body capitalize transition-all touch-target ${
                  sex === s ? "border-accent bg-accent/10 text-secondary-foreground" : "border-border bg-card"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-body-sm font-medium mb-1 block">
            Phone (WhatsApp) <span className="text-muted-foreground font-normal">— optional</span>
          </label>
          <Input
            type="tel"
            inputMode="tel"
            placeholder="+234 803 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-14 text-body rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            We only use this if our support team needs to reach you about a stuck upload.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-start gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-body">Your data is safe</p>
            <p className="text-body-sm text-muted-foreground">
              We comply with NDPA 2023. Your lab images are deleted immediately after processing. We never share your data.
            </p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer touch-target">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-6 h-6 rounded mt-0.5 accent-accent"
          />
          <span className="text-body-sm">
            I consent to the processing of my health data as described in the{" "}
            <span className="text-primary underline">Privacy Policy</span> and accept the{" "}
            <span className="text-primary underline">Medical Disclaimer</span>.
          </span>
        </label>
      </div>
    </div>,
  ];

  const canProceed = [
    true,
    !!role,
    !!zone,
    !!age && !!sex && consent,
  ][step];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= step ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {screens[step]}
      </div>

      {/* Actions */}
      <div className="mt-8">
        <Button
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleComplete();
          }}
          disabled={!canProceed}
          className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
        >
          {step === 3 ? "Get Started" : "Continue"}
        </Button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full text-center mt-3 text-muted-foreground touch-target"
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
