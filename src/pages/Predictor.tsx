import { useState } from "react";
import { Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CollegeCard, CollegeCardSkeleton, type College } from "@/components/CollegeCard";
import { useSavedColleges } from "@/hooks/useSavedColleges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Exam = "JEE" | "CAT";
type Matched = College & { matchTier: "safe" | "edge" };

const Predictor = () => {
  const [exam, setExam] = useState<Exam>("JEE");
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Matched[]>([]);
  const { savedIds, toggle, isAuthed } = useSavedColleges();

  const handleToggleSave = async (id: string) => {
    if (!isAuthed) {
      toast.error("Please log in to save colleges");
      return;
    }
    const res = await toggle(id);
    if (res.ok) toast.success(res.action === "saved" ? "College saved ✓" : "Removed from saved");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    if (!value || Number.isNaN(num)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (exam === "JEE" && (num < 1 || num > 200000)) {
      toast.error("Enter a JEE rank between 1 and 200000");
      return;
    }
    if (exam === "CAT" && (num < 0 || num > 100)) {
      toast.error("Enter a CAT percentile between 0 and 100");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    const query = supabase.from("colleges").select("*").order("rating", { ascending: false });
    const { data, error } =
      exam === "JEE"
        ? await query.lte("jee_min_rank", num).gte("jee_max_rank", num)
        : await query.lte("cat_min_percentile", num).gte("cat_max_percentile", num);

    if (error) {
      toast.error(error.message);
      setResults([]);
      setLoading(false);
      return;
    }

    const matched: Matched[] = (data ?? []).map((c) => {
      const min = exam === "JEE" ? (c.jee_min_rank ?? 0) : (c.cat_min_percentile ?? 0);
      const max = exam === "JEE" ? (c.jee_max_rank ?? 0) : (c.cat_max_percentile ?? 0);
      const range = max - min || 1;
      // For JEE: lower rank = better. "edge" if user is in top 30% of range (closer to min).
      // For CAT: higher percentile = better. "edge" if user is in bottom 30% of range (closer to min).
      const positionFromMin = (num - min) / range; // 0 at min, 1 at max
      const isEdge = exam === "JEE" ? positionFromMin <= 0.3 : positionFromMin <= 0.3;
      return { ...c, matchTier: isEdge ? "edge" : "safe" };
    });

    setResults(matched);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="chip bg-primary/10 text-primary border border-primary/20 mb-5 inline-flex">
            <Sparkles className="h-3.5 w-3.5" /> Smart matching
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-3">
            <Target className="h-9 w-9 text-primary" />
            College Predictor
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Enter your exam and rank to see colleges you&apos;re eligible for.
          </p>
        </div>

        {/* Input card */}
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <div className="grid gap-5">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Exam</Label>
              <Select value={exam} onValueChange={(v: Exam) => { setExam(v); setValue(""); }}>
                <SelectTrigger className="bg-background border-border h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JEE">JEE Main</SelectItem>
                  <SelectItem value="CAT">CAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                {exam === "JEE" ? "Your JEE Main Rank" : "Your CAT Percentile"}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step={exam === "JEE" ? 1 : 0.01}
                min={exam === "JEE" ? 1 : 0}
                max={exam === "JEE" ? 200000 : 100}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={exam === "JEE" ? "e.g. 5000" : "e.g. 95.5"}
                className="bg-background border-border h-12 text-base"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 bg-gradient-amber text-primary-foreground hover:opacity-90 font-semibold text-base"
            >
              {loading ? "Finding…" : "Find Colleges"}
            </Button>
          </div>
        </form>

        {/* Results */}
        {hasSearched && (
          <div className="mt-12 animate-fade-up">
            {loading ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <CollegeCardSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-xl mb-2">No colleges found for this {exam === "JEE" ? "rank" : "percentile"}.</p>
                <p className="text-sm">
                  {exam === "JEE" ? "Try a higher rank range." : "Try a different percentile."}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-lg">
                    <span className="font-bold text-primary">{results.length}</span>{" "}
                    {results.length === 1 ? "college matches" : "colleges match"} your profile
                  </p>
                </div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((c) => (
                    <div key={c.id} className="relative">
                      <span
                        className={cn(
                          "absolute top-3 left-1/2 -translate-x-1/2 z-10 chip font-bold shadow-lg",
                          c.matchTier === "safe"
                            ? "bg-govt text-background border border-govt"
                            : "bg-primary text-primary-foreground border border-primary"
                        )}
                      >
                        {c.matchTier === "safe" ? "✓ Safe Match" : "⚡ Borderline"}
                      </span>
                      <CollegeCard
                        college={c}
                        isSaved={savedIds.has(c.id)}
                        onToggleSave={handleToggleSave}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Predictor;
