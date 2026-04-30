import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkCheck, MapPin, Scale, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSavedColleges } from "@/hooks/useSavedColleges";
import { useCompare } from "@/hooks/useCompare";
import { collegeGradient, collegeInitials, formatINR, formatLPA } from "@/lib/format";
import { cn } from "@/lib/utils";

type Detail = {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  affiliation: string | null;
  established: number | null;
  fees_per_year: number;
  rating: number;
  image_url: string | null;
  top_course: string | null;
  courses: { id: string; name: string; duration: string; fees: number }[];
  placements: { avg_package: number; highest_package: number; placement_pct: number; top_recruiters: string[] }[];
  reviews: { id: string; reviewer_name: string; year: number; rating: number; comment: string }[];
};

const CollegeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { savedIds, toggle, isAuthed } = useSavedColleges();
  const { add, has, count, max } = useCompare();
  const isSaved = id ? savedIds.has(id) : false;
  const inCompare = id ? has(id) : false;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("colleges")
      .select("*, courses(*), placements(*), reviews(*)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (error || !row) {
          setNotFound(true);
        } else {
          setData(row as unknown as Detail);
        }
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!isAuthed) {
      toast.error("Please log in to save colleges");
      navigate("/login");
      return;
    }
    if (!id) return;
    const res = await toggle(id);
    if (res.ok) toast.success(res.action === "saved" ? "College saved ✓" : "Removed from saved");
  };

  const handleCompare = () => {
    if (!id) return;
    const res = add(id);
    if (res.ok) toast.success("Added to compare");
    else if (res.reason === "exists") toast("Already in compare");
    else if (res.reason === "full") toast.error(`Compare full (max ${max})`);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold">College not found</h1>
          <p className="text-muted-foreground mt-2">The college you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-6 bg-gradient-amber text-primary-foreground"><Link to="/">Back to Colleges</Link></Button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="skeleton-pulse h-64 w-full rounded-2xl" />
          <div className="skeleton-pulse h-10 w-2/3 mt-8" />
          <div className="skeleton-pulse h-6 w-1/3 mt-4" />
        </div>
      </div>
    );
  }

  const isGovt = data.type === "Government";
  const placement = data.placements?.[0];

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      {/* Hero header */}
      <section
        className="relative h-64 md:h-80 overflow-hidden"
        style={{ background: data.image_url ? undefined : collegeGradient(data.name) }}
      >
        {data.image_url && <img src={data.image_url} alt={data.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-7xl md:text-8xl font-extrabold text-white/95 tracking-tight drop-shadow-2xl">
            {collegeInitials(data.name)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" asChild className="bg-background/60 backdrop-blur-md hover:bg-background/80">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
        </div>
      </section>

      <div className="container -mt-16 relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("chip", isGovt ? "bg-govt/15 text-govt border border-govt/30" : "bg-private-badge/15 text-private-badge border border-private-badge/30")}>
                {data.type}
              </span>
              {data.established && <span className="chip bg-secondary text-muted-foreground">Est. {data.established}</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{data.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {data.city}, {data.state}</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-primary text-primary" /> <span className="font-bold text-foreground">{data.rating.toFixed(1)}</span></span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-10">
          <TabsList className="bg-card border border-border h-auto p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({data.reviews?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 animate-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoCard label="Fees / year" value={formatINR(data.fees_per_year)} />
              <InfoCard label="Established" value={data.established?.toString() ?? "—"} />
              <InfoCard label="Type" value={data.type} />
              <InfoCard label="Affiliation" value={data.affiliation ?? "—"} />
              <InfoCard label="Top Course" value={data.top_course ?? "—"} />
              <InfoCard label="Rating" value={data.rating.toFixed(1)} />
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-6 animate-fade-up">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Course</th>
                    <th className="text-left px-5 py-3 font-semibold">Duration</th>
                    <th className="text-right px-5 py-3 font-semibold">Fees / year</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses?.length ? data.courses.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-5 py-4 font-semibold">{c.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{c.duration}</td>
                      <td className="px-5 py-4 text-right font-bold text-primary">{formatINR(c.fees)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">No courses listed</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="placements" className="mt-6 animate-fade-up">
            {placement ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Average Package" value={formatLPA(placement.avg_package)} />
                  <StatCard label="Highest Package" value={formatLPA(placement.highest_package)} highlight />
                  <StatCard label="Placement %" value={`${placement.placement_pct}%`} />
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-4">Top Recruiters</h3>
                  <div className="flex flex-wrap gap-2">
                    {placement.top_recruiters.map((r) => (
                      <span key={r} className="chip bg-primary/10 text-primary border border-primary/30">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No placement data available.</p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 animate-fade-up">
            <div className="grid gap-4 md:grid-cols-2">
              {data.reviews?.length ? data.reviews.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold">{r.reviewer_name}</div>
                      <div className="text-xs text-muted-foreground">Batch of {r.year}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-bold">{r.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                </div>
              )) : (
                <p className="text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="container flex items-center gap-3 py-4">
          <Button variant="outline" size="lg" onClick={handleSave} className="flex-1 md:flex-none">
            {isSaved ? <BookmarkCheck className="h-4 w-4 mr-2 text-primary" /> : <Bookmark className="h-4 w-4 mr-2" />}
            {isSaved ? "Saved" : "Save College"}
          </Button>
          <Button
            size="lg"
            onClick={handleCompare}
            disabled={inCompare}
            className="flex-1 md:flex-none bg-gradient-amber text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Scale className="h-4 w-4 mr-2" />
            {inCompare ? "In Compare" : `Add to Compare (${count}/${max})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
    <div className="mt-2 text-lg font-bold">{value}</div>
  </div>
);

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={cn("rounded-xl p-6 border", highlight ? "bg-gradient-amber border-primary text-primary-foreground" : "bg-card border-border")}>
    <div className={cn("text-xs uppercase tracking-wider font-semibold", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</div>
    <div className="mt-2 text-3xl font-extrabold">{value}</div>
  </div>
);

export default CollegeDetail;
