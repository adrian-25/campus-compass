import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Scale, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import { collegeGradient, collegeInitials, formatINR, formatLPA } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  fees_per_year: number;
  rating: number;
  top_course: string | null;
  placements: { avg_package: number; highest_package: number; placement_pct: number }[];
};

const Compare = () => {
  const { ids, remove } = useCompare();
  const [colleges, setColleges] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setColleges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("colleges")
      .select("id, name, city, state, type, fees_per_year, rating, top_course, placements(avg_package, highest_package, placement_pct)")
      .in("id", ids)
      .then(({ data }) => {
        // preserve order from ids
        const byId = new Map((data ?? []).map((c) => [c.id, c as unknown as Row]));
        setColleges(ids.map((id) => byId.get(id)).filter(Boolean) as Row[]);
        setLoading(false);
      });
  }, [ids]);

  const best = (values: number[], higherBetter = true) => {
    if (values.length === 0) return -1;
    const target = higherBetter ? Math.max(...values) : Math.min(...values);
    return values.indexOf(target);
  };

  const feesArr = colleges.map((c) => c.fees_per_year);
  const ratingArr = colleges.map((c) => c.rating);
  const avgArr = colleges.map((c) => c.placements?.[0]?.avg_package ?? 0);
  const highArr = colleges.map((c) => c.placements?.[0]?.highest_package ?? 0);
  const pctArr = colleges.map((c) => c.placements?.[0]?.placement_pct ?? 0);

  const bestFees = best(feesArr, false);
  const bestRating = best(ratingArr);
  const bestAvg = best(avgArr);
  const bestHigh = best(highArr);
  const bestPct = best(pctArr);

  if (!loading && colleges.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="mx-auto h-20 w-20 grid place-items-center rounded-full bg-primary/10 text-primary mb-6">
            <Scale className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">No colleges added yet</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Add up to 3 colleges from any college page to compare them side-by-side.
          </p>
          <Button asChild size="lg" className="mt-8 bg-gradient-amber text-primary-foreground"><Link to="/">Browse Colleges</Link></Button>
        </div>
      </div>
    );
  }

  const rows: { label: string; render: (c: Row, i: number) => React.ReactNode; bestIdx?: number }[] = [
    { label: "Location", render: (c) => `${c.city}, ${c.state}` },
    { label: "Type", render: (c) => c.type },
    { label: "Top Course", render: (c) => c.top_course ?? "—" },
    { label: "Fees / year", render: (c) => formatINR(c.fees_per_year), bestIdx: bestFees },
    { label: "Rating", render: (c) => c.rating.toFixed(1), bestIdx: bestRating },
    { label: "Avg Package", render: (c) => formatLPA(c.placements?.[0]?.avg_package), bestIdx: bestAvg },
    { label: "Highest Package", render: (c) => formatLPA(c.placements?.[0]?.highest_package), bestIdx: bestHigh },
    { label: "Placement %", render: (c) => c.placements?.[0]?.placement_pct ? `${c.placements[0].placement_pct}%` : "—", bestIdx: bestPct },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">Compare Colleges</h1>
          <p className="text-muted-foreground mt-2">Best value in each row is highlighted in amber.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-5 font-semibold text-muted-foreground w-40">College</th>
                {colleges.map((c) => (
                  <th key={c.id} className="text-left p-5 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div
                          className="h-12 w-12 rounded-lg grid place-items-center text-white font-extrabold mb-3"
                          style={{ background: collegeGradient(c.name) }}
                        >
                          {collegeInitials(c.name)}
                        </div>
                        <Link to={`/college/${c.id}`} className="font-bold hover:text-primary transition">
                          {c.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => remove(c.id)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                        aria-label="Remove from compare"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="p-5 font-semibold text-muted-foreground">{row.label}</td>
                  {colleges.map((c, i) => (
                    <td key={c.id} className={cn("p-5", row.bestIdx === i && "text-primary font-bold")}>
                      {row.render(c, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Compare;
