import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Shield, MapPin, User, Users, Plus, Pencil, Trash2, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDependants } from "@/hooks/useDependants";
import AddDependantDialog from "@/components/AddDependantDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import type { Dependant, DependantInput } from "@/hooks/useDependants";

const ZONE_LABELS: Record<string, string> = {
  "south-south": "South-South",
  "south-west": "South-West",
  "south-east": "South-East",
  "north-central": "North-Central",
  "north-east": "North-East",
  "north-west": "North-West",
};

const ROLE_LABELS: Record<string, string> = {
  personal: "Personal use",
  caregiver: "Caregiver",
  professional: "Health Professional",
};

const REL_LABELS: Record<string, string> = {
  child: "Child",
  parent: "Parent",
  spouse: "Spouse",
  patient: "Patient",
  sibling: "Sibling",
  other: "Other",
};

const initials = (name?: string | null) =>
  (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

const Profile = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { dependants, addDependant, updateDependant, deleteDependant } = useDependants();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dependant | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast.success("Signed out");
  };

  const roleLabel = profile?.user_role === "professional" ? "patient" : "person";

  const handleAddOrEdit = (data: DependantInput) => {
    if (editing) {
      updateDependant.mutate({ id: editing.id, ...data });
    } else {
      addDependant.mutate(data);
    }
    setEditing(null);
  };

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-extrabold tracking-tight mb-5">Profile</h1>

      {/* Profile header — gradient avatar */}
      <div className="bg-card rounded-3xl border border-border p-6 mb-4 shadow-card">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center font-display font-extrabold text-xl shadow-glow-primary">
              {initials(profile?.full_name)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold text-lg truncate">{profile?.full_name || "—"}</p>
            <p className="text-body-sm text-muted-foreground truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary mt-1.5">
              {ROLE_LABELS[profile?.user_role || "personal"]}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Region
            </p>
            <p className="text-sm font-semibold">
              {profile?.geopolitical_zone ? ZONE_LABELS[profile.geopolitical_zone] : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Demographics
            </p>
            <p className="text-sm font-semibold">
              {profile?.age ? `${profile.age}y` : "—"} · {profile?.sex || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* People I manage */}
      <div className="bg-card rounded-3xl border border-border p-5 mb-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-secondary" />
            </div>
            <p className="font-display font-bold">
              {profile?.user_role === "professional" ? "My Patients" : "People I Manage"}
            </p>
          </div>
        </div>

        {dependants.length === 0 ? (
          <p className="text-body-sm text-muted-foreground mb-3">
            No {roleLabel}s added yet. Add someone to upload and track their lab results.
          </p>
        ) : (
          <div className="space-y-2 mb-3">
            {dependants.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-border transition-colors hover:bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center text-xs font-bold shadow-soft">
                  {initials(d.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {REL_LABELS[d.relationship] || d.relationship}
                    {d.age ? ` · ${d.age}y` : ""}
                    {d.sex ? ` · ${d.sex}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDependant.mutate(d.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full border-2 border-dashed border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground touch-target transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Add {roleLabel}
        </button>
      </div>

      {/* Privacy + Disclaimer combined */}
      <div className="bg-card rounded-3xl border border-border p-5 mb-5 shadow-soft">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <p className="font-display font-bold">Privacy & disclaimer</p>
        </div>
        <ul className="space-y-1.5 text-body-sm text-muted-foreground mb-3">
          <li>• NDPA 2023 compliant</li>
          <li>• Lab images deleted after processing</li>
          <li>• Your data is never shared</li>
        </ul>
        <p className="text-xs text-muted-foreground/90 leading-relaxed pt-3 border-t border-border">
          VeriDIA provides nutritional guidance based on your lab results. It is not a substitute
          for professional medical advice, diagnosis, or treatment. Always consult your doctor.
        </p>
      </div>

      <Button
        onClick={handleSignOut}
        variant="ghost"
        className="w-full h-13 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 touch-target font-semibold"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sign Out
      </Button>

      <AddDependantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddOrEdit}
        editing={editing}
        roleLabel={roleLabel}
      />
    </div>
  );
};

export default Profile;
