import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Shield, MapPin, User, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDependants } from "@/hooks/useDependants";
import AddDependantDialog from "@/components/AddDependantDialog";
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
    <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6">Your Profile</h1>

      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">{profile?.full_name || "—"}</p>
            <p className="text-body-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3 text-body-sm">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-secondary" />
            <span>{profile?.geopolitical_zone ? ZONE_LABELS[profile.geopolitical_zone] : "Not set"}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-secondary" />
            <span>
              {profile?.age ? `${profile.age} years` : "Age not set"} • {profile?.sex ? profile.sex : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-secondary" />
            <span>{ROLE_LABELS[profile?.user_role || "personal"] || "Personal use"}</span>
          </div>
        </div>
      </div>

      {/* People I manage */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-secondary" />
            <p className="font-semibold">
              {profile?.user_role === "professional" ? "My Patients" : "People I Manage"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="text-accent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {dependants.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            No {roleLabel}s added yet. Add someone to upload and track their lab results.
          </p>
        ) : (
          <div className="space-y-3">
            {dependants.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-body-sm">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {REL_LABELS[d.relationship] || d.relationship}
                    {d.age ? ` • ${d.age}yrs` : ""}
                    {d.sex ? ` • ${d.sex}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditing(d); setDialogOpen(true); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteDependant.mutate(d.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-secondary" />
          <p className="font-semibold">Privacy & Data</p>
        </div>
        <div className="space-y-2 text-body-sm text-muted-foreground">
          <p>✅ NDPA 2023 compliant</p>
          <p>✅ Lab images deleted after processing</p>
          <p>✅ Your data is never shared</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <p className="font-semibold mb-2 text-body-sm">Medical Disclaimer</p>
        <p className="text-xs text-muted-foreground">
          VeriDIA provides nutritional guidance based on your lab results. It is NOT a substitute for
          professional medical advice, diagnosis, or treatment. Always consult your doctor or qualified
          healthcare provider with questions about your medical condition.
        </p>
      </div>

      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full h-14 rounded-xl text-destructive border-destructive/30 touch-target"
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
