import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DependantInput, Dependant } from "@/hooks/useDependants";

const ZONES = [
  { value: "south-south", label: "South-South" },
  { value: "south-west", label: "South-West" },
  { value: "south-east", label: "South-East" },
  { value: "north-central", label: "North-Central" },
  { value: "north-east", label: "North-East" },
  { value: "north-west", label: "North-West" },
];

const RELATIONSHIPS = [
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "patient", label: "Patient" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DependantInput) => void;
  editing?: Dependant | null;
  roleLabel?: string;
};

const AddDependantDialog = ({ open, onOpenChange, onSubmit, editing, roleLabel = "person" }: Props) => {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [zone, setZone] = useState<"south-south" | "south-west" | "south-east" | "north-central" | "north-east" | "north-west" | "">("");
  const [relationship, setRelationship] = useState("");

  useEffect(() => {
    if (editing) {
      setFullName(editing.full_name);
      setAge(editing.age?.toString() || "");
      setSex(editing.sex || "");
      setZone(editing.geopolitical_zone || "");
      setRelationship(editing.relationship);
    } else {
      setFullName("");
      setAge("");
      setSex("");
      setZone("");
      setRelationship("");
    }
  }, [editing, open]);

  const handleSubmit = () => {
    if (!fullName.trim() || !relationship) return;
    onSubmit({
      full_name: fullName.trim(),
      age: age ? parseInt(age) : null,
      sex: sex || null,
      geopolitical_zone: zone || null,
      relationship,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit" : "Add"} {roleLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-body-sm font-medium mb-1 block">Full Name *</label>
            <Input
              placeholder="e.g. Adaeze Okafor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div>
            <label className="text-body-sm font-medium mb-1 block">Relationship *</label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRelationship(r.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    relationship === r.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-body-sm font-medium mb-1 block">Age</label>
              <Input
                type="number"
                placeholder="e.g. 8"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="text-body-sm font-medium mb-1 block">Sex</label>
              <div className="flex gap-2">
                {(["male", "female"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 h-12 rounded-xl border text-sm font-medium capitalize transition-all ${
                      sex === s ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-body-sm font-medium mb-1 block">Region</label>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map((z) => (
                <button
                  key={z.value}
                  onClick={() => setZone(z.value)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    zone === z.value
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : "border-border bg-card"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!fullName.trim() || !relationship}
            className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            {editing ? "Save Changes" : `Add ${roleLabel}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDependantDialog;
