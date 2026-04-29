import { useState } from "react";
import { ChevronDown, Plus, Check, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useActiveProfile, initialsOf, REL_LABELS } from "@/contexts/ActiveProfileContext";
import { useDependants } from "@/hooks/useDependants";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats } from "@/hooks/useProfileStats";
import AddDependantDialog from "@/components/AddDependantDialog";
import type { DependantInput } from "@/hooks/useDependants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ProfileSwitcher = () => {
  const { activeProfile, activeProfileId, setActiveProfileId } = useActiveProfile();
  const { profile } = useAuth();
  const { dependants, addDependant } = useDependants();
  const { get } = useProfileStats();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const select = (id: string | null, name: string) => {
    setActiveProfileId(id);
    setOpen(false);
    toast.success(`Now viewing ${name}`);
  };

  const handleAdd = (data: DependantInput) => {
    addDependant.mutate(data);
  };

  const ownName = profile?.full_name?.split(" ")[0] || "You";
  const selfStats = get(null);
  const activeStats = get(activeProfileId);
  const hasFlags = activeStats.flagged > 0;

  return (
    <>
      <div className="sticky top-0 z-40 px-4 pt-3 pb-2 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="w-full max-w-lg mx-auto flex items-center gap-3 bg-card border border-border rounded-full pl-1.5 pr-4 py-1.5 shadow-soft touch-target transition-all hover:shadow-card tap-scale"
              aria-label="Switch active profile"
            >
              <div className="relative shrink-0">
                {hasFlags && (
                  <span aria-hidden className="absolute -inset-1 rounded-full bg-destructive/40 blur-md animate-heartbeat" />
                )}
                <div className={cn(
                  "relative w-9 h-9 rounded-full text-primary-foreground flex items-center justify-center text-xs font-bold shadow-soft",
                  activeProfile.isSelf ? "bg-gradient-navy" : "bg-gradient-brand"
                )}>
                  {initialsOf(activeProfile.name)}
                </div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">
                  Viewing
                </p>
                <p className="font-semibold text-sm truncate leading-tight mt-0.5">
                  {activeProfile.isSelf ? `${ownName} (You)` : activeProfile.name}
                </p>
              </div>
              {!activeProfile.isSelf && (
                <span className="hidden xs:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                  {REL_LABELS[activeProfile.relationship] || activeProfile.relationship}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Switch profile
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-2">
              {/* Self */}
              <ProfileRow
                name={`${ownName} (You)`}
                relationship="self"
                stats={selfStats}
                active={activeProfile.isSelf}
                onClick={() => select(null, "yourself")}
              />

              {dependants.map((d) => (
                <ProfileRow
                  key={d.id}
                  name={d.full_name}
                  relationship={d.relationship}
                  age={d.age}
                  stats={get(d.id)}
                  active={activeProfile.id === d.id}
                  onClick={() => select(d.id, d.full_name)}
                />
              ))}

              <button
                onClick={() => { setOpen(false); setAddOpen(true); }}
                className="w-full mt-3 border-2 border-dashed border-border rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground touch-target transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4" />
                Add family member
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AddDependantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
        roleLabel="family member"
      />
    </>
  );
};

const ProfileRow = ({
  name,
  relationship,
  age,
  stats,
  active,
  onClick,
}: {
  name: string;
  relationship: string;
  age?: number | null;
  stats: { total: number; lastDate: string | null };
  active: boolean;
  onClick: () => void;
}) => {
  const isSelf = relationship === "self";
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl p-3 text-left border transition-all touch-target",
        active
          ? "border-primary bg-primary/5 shadow-soft"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
      )}
    >
      <div className={cn(
        "w-11 h-11 rounded-full text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0",
        isSelf ? "bg-gradient-navy" : "bg-gradient-brand"
      )}>
        {initialsOf(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            {REL_LABELS[relationship] || relationship}
            {age ? ` · ${age}y` : ""}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {stats.total} {stats.total === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
      {active && (
        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
      )}
    </button>
  );
};
