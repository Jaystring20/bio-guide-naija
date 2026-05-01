import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { advisoryBoard, ADVISORY_BOARD_STATUS } from "@/data/advisoryBoard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const accentClass: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export function AdvisoryBoardPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="advisory-board" className="py-20 md:py-28 px-4 scroll-mt-20">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto space-y-12"
      >
        <motion.div variants={fadeUp} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-semibold uppercase tracking-widest">
            <Stethoscope className="w-4 h-4" />
            Nutrition & Clinical Advisory Board
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
            Real Nigerian experts behind every recommendation
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Endocrinologists, registered dietitians, and food scientists review VeriDIA's
            safety thresholds, diet templates, and local food mappings.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {ADVISORY_BOARD_STATUS.label}
          </div>
        </motion.div>

        <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {advisoryBoard.slice(0, 6).map((m) => (
            <motion.article
              key={m.id}
              variants={fadeUp}
              className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center font-bold text-lg ${accentClass[m.accent]}`}>
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-tight">{m.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.credentials}</p>
                  <p className="text-sm font-medium text-secondary-foreground mt-1.5">{m.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-3">{m.bio}</p>
              <p className="text-xs text-muted-foreground/80 mt-3">{m.affiliation}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="flex justify-center">
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/advisory-board">
              Meet the full board
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
