import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CollegeCard, CollegeCardSkeleton, type College } from "@/components/CollegeCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSavedColleges } from "@/hooks/useSavedColleges";

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  const { savedIds, toggle } = useSavedColleges();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setColleges([]);
      setLoading(false);
      return;
    }
    if (savedIds.size === 0) {
      setColleges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("colleges")
      .select("*")
      .in("id", Array.from(savedIds))
      .then(({ data }) => {
        setColleges((data ?? []) as College[]);
        setLoading(false);
      });
  }, [user, savedIds]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <CollegeCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="mx-auto h-20 w-20 grid place-items-center rounded-full bg-primary/10 text-primary mb-6">
            <Bookmark className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">Please log in to view saved colleges</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Save colleges to revisit them anytime, on any device.
          </p>
          <Button asChild size="lg" className="mt-8 bg-gradient-amber text-primary-foreground"><Link to="/login">Log in</Link></Button>
        </div>
      </div>
    );
  }

  const handleToggle = async (id: string) => {
    const res = await toggle(id);
    if (res.ok) toast.success(res.action === "saved" ? "College saved ✓" : "Removed from saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">Saved Colleges</h1>
          <p className="text-muted-foreground mt-2">{colleges.length} {colleges.length === 1 ? "college" : "colleges"} saved</p>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <CollegeCardSkeleton key={i} />)}
          </div>
        ) : colleges.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground mb-2">You haven&apos;t saved any colleges yet</p>
            <Button asChild className="mt-4 bg-gradient-amber text-primary-foreground"><Link to="/">Browse Colleges</Link></Button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {colleges.map((c) => (
              <CollegeCard key={c.id} college={c} isSaved={savedIds.has(c.id)} onToggleSave={handleToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
