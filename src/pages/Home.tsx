import { useEffect, useMemo, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CollegeCard, CollegeCardSkeleton, type College } from "@/components/CollegeCard";
import { useSavedColleges } from "@/hooks/useSavedColleges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

const FEE_OPTIONS = [
  { label: "< ₹2L", value: "200000" },
  { label: "< ₹5L", value: "500000" },
  { label: "< ₹10L", value: "1000000" },
  { label: "< ₹20L", value: "2000000" },
];

const Home = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [maxFees, setMaxFees] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { savedIds, toggle, isAuthed } = useSavedColleges();

  useEffect(() => {
    setLoading(true);
    supabase.from("colleges").select("*").order("rating", { ascending: false }).then(({ data, error }) => {
      if (error) toast.error(error.message);
      setColleges(data ?? []);
      setLoading(false);
    });
  }, []);

  const cities = useMemo(() => Array.from(new Set(colleges.map((c) => c.city))).sort(), [colleges]);
  const courses = useMemo(
    () => Array.from(new Set(colleges.map((c) => c.top_course).filter(Boolean) as string[])).sort(),
    [colleges]
  );

  const filtered = useMemo(() => {
    return colleges.filter((c) => {
      if (search && !`${c.name} ${c.city} ${c.state}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (city !== "all" && c.city !== city) return false;
      if (maxFees !== "all" && c.fees_per_year > Number(maxFees)) return false;
      if (course !== "all" && c.top_course !== course) return false;
      return true;
    });
  }, [colleges, search, city, maxFees, course]);

  useEffect(() => setPage(1), [search, city, maxFees, course]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search || city !== "all" || maxFees !== "all" || course !== "all";

  const handleToggleSave = async (id: string) => {
    if (!isAuthed) {
      toast.error("Please log in to save colleges");
      return;
    }
    const res = await toggle(id);
    if (res.ok) toast.success(res.action === "saved" ? "College saved ✓" : "Removed from saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-hero border-b border-border">
        <div className="container py-16 md:py-24 text-center">
          <span className="chip bg-primary/10 text-primary border border-primary/20 mb-6">
            🇮🇳 India&apos;s smartest college finder
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Find your <span className="bg-gradient-amber bg-clip-text text-transparent">perfect college</span> in India
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Compare 1000+ colleges across fees, placements, and reviews. Make the right decision.
          </p>

          <div className="mt-10 max-w-2xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colleges, cities, states..."
              className="h-14 pl-14 pr-4 text-base bg-card border-border focus-visible:ring-primary rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={maxFees} onValueChange={setMaxFees}>
            <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue placeholder="Max fees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any fees</SelectItem>
              {FEE_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="w-[220px] bg-card border-border"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setCity("all"); setMaxFees("all"); setCourse("all"); }}
              className="text-sm text-primary hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "college" : "colleges"}`}
          </div>
        </div>

        {/* Active chips */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />}
            {city !== "all" && <FilterChip label={city} onRemove={() => setCity("all")} />}
            {maxFees !== "all" && <FilterChip label={FEE_OPTIONS.find((f) => f.value === maxFees)?.label ?? ""} onRemove={() => setMaxFees("all")} />}
            {course !== "all" && <FilterChip label={course} onRemove={() => setCourse("all")} />}
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="container pb-20">
        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CollegeCardSkeleton key={i} />)}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl mb-2">No colleges match your filters</p>
            <p className="text-sm">Try clearing some filters above.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {pageItems.map((c) => (
              <CollegeCard key={c.id} college={c} isSaved={savedIds.has(c.id)} onToggleSave={handleToggleSave} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "h-10 w-10 rounded-md text-sm font-semibold border",
                  page === i + 1 ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <button onClick={onRemove} className="chip bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition">
    {label}
    <X className="h-3 w-3" />
  </button>
);

export default Home;
