import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, MapPin, Star } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { collegeGradient, collegeInitials, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export type College = Database["public"]["Tables"]["colleges"]["Row"];

interface Props {
  college: College;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export const CollegeCard = ({ college, isSaved, onToggleSave }: Props) => {
  const isGovt = college.type === "Government";
  return (
    <article className="college-card group flex flex-col">
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{ background: college.image_url ? undefined : collegeGradient(college.name) }}
      >
        {college.image_url ? (
          <img src={college.image_url} alt={college.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-5xl font-extrabold text-white/95 tracking-tight drop-shadow-lg">
              {collegeInitials(college.name)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />

        <button
          aria-label={isSaved ? "Remove from saved" : "Save college"}
          onClick={(e) => {
            e.preventDefault();
            onToggleSave(college.id);
          }}
          className={cn(
            "absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition",
            isSaved ? "bg-primary text-primary-foreground" : "bg-background/60 text-foreground hover:bg-background/80"
          )}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>

        <span
          className={cn(
            "absolute top-3 left-3 chip",
            isGovt ? "bg-govt/15 text-govt border border-govt/30" : "bg-private-badge/15 text-private-badge border border-private-badge/30"
          )}
        >
          {college.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {college.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{college.city}, {college.state}</span>
          </div>
        </div>

        {college.top_course && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            <span className="text-foreground/70 font-medium">Top:</span> {college.top_course}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Fees / yr</div>
            <div className="text-lg font-bold text-foreground">{formatINR(college.fees_per_year)}</div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-bold">{college.rating.toFixed(1)}</span>
          </div>
        </div>

        <Link
          to={`/college/${college.id}`}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-secondary py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground"
        >
          View Details
        </Link>
      </div>
    </article>
  );
};

export const CollegeCardSkeleton = () => (
  <div className="college-card flex flex-col">
    <div className="skeleton-pulse h-44 w-full rounded-none" />
    <div className="flex flex-col gap-3 p-5">
      <div className="skeleton-pulse h-5 w-3/4" />
      <div className="skeleton-pulse h-4 w-1/2" />
      <div className="skeleton-pulse h-4 w-2/3" />
      <div className="skeleton-pulse h-9 w-full mt-3" />
    </div>
  </div>
);
