import { useEffect, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { DiscussionPanel } from "@/components/Discussion";
import { Input } from "@/components/ui/input";

const Discussions = () => {
  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("colleges")
      .select("id, name")
      .order("name")
      .then(({ data }) => setColleges(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="chip bg-primary/10 text-primary border border-primary/20 mb-5 inline-flex">
              <MessageSquare className="h-3.5 w-3.5" /> Community
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Discussions</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Ask questions, share answers, and learn from the CampusIQ community.
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="h-12 pl-11 bg-card border-border rounded-full"
            />
          </div>

          <DiscussionPanel collegeOptions={colleges} showCollegeLink search={search} />
        </div>
      </section>
    </div>
  );
};

export default Discussions;
