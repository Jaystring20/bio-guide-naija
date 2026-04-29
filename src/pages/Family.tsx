import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDependants, type Dependant, type DependantInput } from "@/hooks/useDependants";
import { useActiveProfile, initialsOf, REL_LABELS } from "@/contexts/ActiveProfileContext";
import { useProfileStats, type ProfileStats } from "@/hooks/useProfileStats";
import AddDependantDialog from "@/components/AddDependantDialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Clock, AlertTriangle, Pencil, Trash2, Users, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

const Family = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { dependants, addDependant, updateDependant, deleteDependant } = useDependants();
  const { activeProfileId, setActiveProfileId } = useActiveProfile();
  const { get } = useProfileStats();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dependant | null>(null);

  const handleSubmit = (data: DependantInput) => {
    if (editing) {
      updateDependant.mutate({ id: editing.id, ...data });
    } else {
      addDependant.mutate(data);
    }
    setEditing(null);
  };

  const switchAndGo = (id: string | null, path: string) => {
    setActiveProfileId(id);
    navigate(path);
  };

  const ownName = profile?.full_name?.split(" ")[0] || "You";
  const ownStats = get(null);

  return (
    <div className="px-5 pt-4 pb-4 max-w-lg mx-auto">
      <div className="mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary mb-2">
          <Users className="w-3 h-3" />
          Family Plan
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Your family</h1>
        <p className="text-muted-foreground text-body-sm mt-1">
          Manage health for everyone you care for from one place.
        </p>
      </div>

      <div className="space-y-3">
        {/* Self */}
        <FamilyCard
          name={`${ownName} (You)`}
          relationship="self"
          age={profile?.age}
          stats={ownStats}
          isActive={activeProfileId === null}
          onView={() => switchAndGo(null, "/history")}
          onUpload={() => switchAndGo(null, "/upload")}
          index={0}
        />

        {dependants.map((d, i) => (
          <FamilyCard
            key={d.id}
            name={d.full_name}
            relationship={d.relationship}
            age={d.age}
            stats={get(d.id)}
            isActive={activeProfileId === d.id}
            onView={() => switchAndGo(d.id, "/history")}
            onUpload={() => switchAndGo(d.id, "/upload")}
            onEdit={() => { setEditing(d); setDialogOpen(true); }}
            onDelete={() => {
              if (confirm(`Remove ${d.full_name} from your family?`)) {
                deleteDependant.mutate(d.id);
              }
            }}
            index={i + 1}
          />
        ))}

        {/* Empty state for caregivers with no dependants yet */}
        {dependants.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-brand-soft border border-primary/20 rounded-3xl p-7 text-center"
          >
            <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl animate-heartbeat" />
            <div aria-hidden className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-secondary/15 blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center mx-auto mb-4 animate-breathe">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="font-display font-bold text-lg">Bring your loved ones along</p>
              <p className="text-body-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Add a parent, child or anyone you care for. Track their results and feel a little more in control.
              </p>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full mt-2 border-2 border-dashed border-primary/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary touch-target transition-colors hover:border-primary/60 hover:bg-primary/5 animate-breathe"
        >
          <Plus className="w-4 h-4" />
          Add family member
        </button>
      </div>

      <AddDependantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        editing={editing}
        roleLabel="family member"
      />
    </div>
  );
};

const FamilyCard = ({
  name,
  relationship,
  age,
  stats,
  isActive,
  onView,
  onUpload,
  onEdit,
  onDelete,
  index,
}: {
  name: string;
  relationship: string;
  age?: number | null;
  stats: ProfileStats;
  isActive: boolean;
  onView: () => void;
  onUpload: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index: number;
}) => {
  const isSelf = relationship === "self";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
      className={cn(
        "bg-card border rounded-3xl p-5 shadow-soft transition-all",
        isActive ? "border-primary/50 shadow-card" : "border-border hover:shadow-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-2xl text-primary-foreground flex items-center justify-center font-bold shrink-0",
          isSelf ? "bg-gradient-navy" : "bg-gradient-brand"
        )}>
          {initialsOf(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold truncate">{name}</p>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {REL_LABELS[relationship] || relationship}
            {age ? ` · ${age}y` : ""}
          </p>
        </div>
        {!isSelf && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
        <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Results" value={String(stats.total)} />
        <Stat
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Flagged"
          value={String(stats.flagged)}
          tone={stats.flagged > 0 ? "warn" : undefined}
        />
        <Stat icon={<ArrowUpRight className="w-3.5 h-3.5" />} label="Latest" value={formatDate(stats.lastDate)} />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onView}
          variant="outline"
          className="flex-1 h-11 rounded-xl font-semibold"
        >
          <Clock className="w-4 h-4 mr-1.5" /> History
        </Button>
        <Button
          onClick={onUpload}
          className="flex-1 h-11 rounded-xl bg-gradient-brand text-primary-foreground hover:opacity-95 border-0 font-semibold shadow-glow-primary"
        >
          <Upload className="w-4 h-4 mr-1.5" /> Upload
        </Button>
      </div>
    </motion.div>
  );
};

const Stat = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "warn" }) => (
  <div className="bg-muted/50 rounded-xl px-2.5 py-2">
    <div className="flex items-center gap-1 text-muted-foreground">
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
    </div>
    <p className={cn(
      "font-display font-bold text-sm mt-0.5 truncate",
      tone === "warn" && Number(value) > 0 && "text-destructive"
    )}>
      {value}
    </p>
  </div>
);

export default Family;
