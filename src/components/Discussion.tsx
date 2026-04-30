import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { emailHandle, timeAgo } from "@/lib/timeAgo";

export type Question = {
  id: string;
  college_id: string;
  user_id: string;
  user_email: string;
  title: string;
  body: string | null;
  created_at: string;
  college_name?: string;
};

export type Answer = {
  id: string;
  question_id: string;
  user_id: string;
  user_email: string;
  body: string;
  created_at: string;
};

interface QuestionCardProps {
  question: Question;
  answers: Answer[];
  expanded: boolean;
  onToggleExpand: () => void;
  onAnswerAdded: (a: Answer) => void;
  onDelete?: (id: string) => void;
  showCollegeLink?: boolean;
}

export const QuestionCard = ({
  question,
  answers,
  expanded,
  onToggleExpand,
  onAnswerAdded,
  onDelete,
  showCollegeLink,
}: QuestionCardProps) => {
  const { user } = useAuth();
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isMine = user?.id === question.user_id;

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to post");
      return;
    }
    const body = answerText.trim();
    if (!body) return;
    setSubmitting(true);

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Answer = {
      id: tempId,
      question_id: question.id,
      user_id: user.id,
      user_email: user.email ?? "",
      body,
      created_at: new Date().toISOString(),
    };
    onAnswerAdded(optimistic);
    setAnswerText("");

    const { data, error } = await supabase
      .from("answers")
      .insert({
        question_id: question.id,
        user_id: user.id,
        user_email: user.email ?? "",
        body,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      // Revert optimistic
      onAnswerAdded({ ...optimistic, id: `__remove__${tempId}` });
      setAnswerText(body);
    } else if (data) {
      onAnswerAdded({ ...(data as Answer), id: `__replace__${tempId}__${data.id}` });
    }
  };

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onToggleExpand} className="flex-1 text-left group">
            <h3 className="font-bold text-base md:text-lg leading-snug group-hover:text-primary transition-colors">
              {question.title}
            </h3>
            {question.body && (
              <p className={cn("mt-2 text-sm text-muted-foreground", !expanded && "line-clamp-2")}>
                {question.body}
              </p>
            )}
          </button>
          {isMine && onDelete && (
            <button
              onClick={() => onDelete(question.id)}
              aria-label="Delete question"
              className="text-muted-foreground hover:text-destructive p-1 -mr-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            by <span className="text-foreground font-medium">{emailHandle(question.user_email)}</span>
          </span>
          <span>{timeAgo(question.created_at)}</span>
          {showCollegeLink && question.college_name && (
            <Link
              to={`/college/${question.college_id}`}
              className="text-primary hover:underline font-medium"
            >
              {question.college_name}
            </Link>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 chip bg-secondary text-foreground">
            <MessageCircle className="h-3 w-3" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </span>
          <button
            onClick={onToggleExpand}
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            {expanded ? <>Hide <ChevronUp className="h-3 w-3" /></> : <>View <ChevronDown className="h-3 w-3" /></>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-background/40 p-5 animate-fade-up">
          <div className="space-y-3">
            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No answers yet. Be the first!</p>
            ) : (
              answers.map((a) => (
                <div key={a.id} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      by <span className="text-foreground font-medium">{emailHandle(a.user_email)}</span>
                    </span>
                    <span>{timeAgo(a.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {user ? (
            <form onSubmit={submitAnswer} className="mt-4 space-y-2">
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write an answer…"
                className="bg-card border-border min-h-[90px]"
                required
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !answerText.trim()}
                  size="sm"
                  className="bg-gradient-amber text-primary-foreground hover:opacity-90"
                >
                  Post Answer
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link> to write an answer.
            </p>
          )}
        </div>
      )}
    </article>
  );
};

interface AskFormProps {
  defaultCollegeId?: string;
  collegeOptions?: { id: string; name: string }[];
  onCancel: () => void;
  onCreated: (q: Question) => void;
}

export const AskQuestionForm = ({ defaultCollegeId, collegeOptions, onCancel, onCreated }: AskFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [collegeId, setCollegeId] = useState(defaultCollegeId ?? "");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to post");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!collegeId) {
      toast.error("Please select a college");
      return;
    }
    setSubmitting(true);

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Question = {
      id: tempId,
      college_id: collegeId,
      user_id: user.id,
      user_email: user.email ?? "",
      title: title.trim(),
      body: body.trim() || null,
      created_at: new Date().toISOString(),
      college_name: collegeOptions?.find((c) => c.id === collegeId)?.name,
    };
    onCreated(optimistic);

    const { data, error } = await supabase
      .from("questions")
      .insert({
        college_id: collegeId,
        user_id: user.id,
        user_email: user.email ?? "",
        title: title.trim(),
        body: body.trim() || null,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      onCreated({ ...optimistic, id: `__remove__${tempId}` });
      return;
    }
    if (data) {
      onCreated({ ...(data as Question), id: `__replace__${tempId}__${data.id}`, college_name: optimistic.college_name });
      toast.success("Question posted ✓");
      onCancel();
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Ask a Question</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {collegeOptions && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">College</Label>
          <select
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a college…</option>
            {collegeOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold mb-2 block">Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your question title"
          maxLength={200}
          required
          className="bg-background border-border"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">Details (optional)</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add more details…"
          maxLength={2000}
          className="bg-background border-border min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-gradient-amber text-primary-foreground hover:opacity-90"
        >
          {submitting ? "Posting…" : "Submit"}
        </Button>
      </div>
    </form>
  );
};

interface DiscussionPanelProps {
  collegeId?: string; // when provided: filter by college
  collegeOptions?: { id: string; name: string }[]; // when provided: show selector in form
  showCollegeLink?: boolean;
  search?: string;
}

export const DiscussionPanel = ({ collegeId, collegeOptions, showCollegeLink, search }: DiscussionPanelProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answersByQ, setAnswersByQ] = useState<Record<string, Answer[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const qQuery = supabase
        .from("questions")
        .select("*, colleges(name)")
        .order("created_at", { ascending: false });
      if (collegeId) qQuery.eq("college_id", collegeId);

      const { data: qs, error } = await qQuery;
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const list: Question[] = (qs ?? []).map((q: any) => ({
        ...q,
        college_name: q.colleges?.name,
      }));
      setQuestions(list);

      const ids = list.map((q) => q.id);
      if (ids.length) {
        const { data: ans } = await supabase
          .from("answers")
          .select("*")
          .in("question_id", ids)
          .order("created_at", { ascending: true });
        if (!cancelled && ans) {
          const grouped: Record<string, Answer[]> = {};
          for (const a of ans as Answer[]) {
            (grouped[a.question_id] ||= []).push(a);
          }
          setAnswersByQ(grouped);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [collegeId]);

  const handleQuestionCreated = (q: Question) => {
    if (q.id.startsWith("__remove__")) {
      const tempId = q.id.replace("__remove__", "");
      setQuestions((prev) => prev.filter((x) => x.id !== tempId));
      return;
    }
    if (q.id.startsWith("__replace__")) {
      const [, tempId, realId] = q.id.split("__").filter(Boolean);
      setQuestions((prev) => prev.map((x) => (x.id === tempId ? { ...q, id: realId } : x)));
      return;
    }
    setQuestions((prev) => [q, ...prev]);
  };

  const handleAnswerAdded = (qid: string) => (a: Answer) => {
    if (a.id.startsWith("__remove__")) {
      const tempId = a.id.replace("__remove__", "");
      setAnswersByQ((prev) => ({ ...prev, [qid]: (prev[qid] ?? []).filter((x) => x.id !== tempId) }));
      return;
    }
    if (a.id.startsWith("__replace__")) {
      const [, tempId, realId] = a.id.split("__").filter(Boolean);
      setAnswersByQ((prev) => ({
        ...prev,
        [qid]: (prev[qid] ?? []).map((x) => (x.id === tempId ? { ...a, id: realId } : x)),
      }));
      return;
    }
    setAnswersByQ((prev) => ({ ...prev, [qid]: [...(prev[qid] ?? []), a] }));
  };

  const handleDelete = async (id: string) => {
    const prev = questions;
    setQuestions((p) => p.filter((q) => q.id !== id));
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setQuestions(prev);
    } else {
      toast.success("Question deleted");
    }
  };

  const filtered = search
    ? questions.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))
    : questions;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        {user ? (
          !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-amber text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1" /> Ask a Question
            </Button>
          )
        ) : (
          <Link to="/login" className="text-sm text-primary font-semibold hover:underline">
            Login to ask a question
          </Link>
        )}
      </div>

      {showForm && (
        <AskQuestionForm
          defaultCollegeId={collegeId}
          collegeOptions={collegeOptions}
          onCancel={() => setShowForm(false)}
          onCreated={handleQuestionCreated}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-pulse h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-base">
            {search ? "No questions match your search." : "No questions yet. Be the first to ask!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              answers={answersByQ[q.id] ?? []}
              expanded={!!expanded[q.id]}
              onToggleExpand={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))}
              onAnswerAdded={handleAnswerAdded(q.id)}
              onDelete={handleDelete}
              showCollegeLink={showCollegeLink}
            />
          ))}
        </div>
      )}
    </div>
  );
};
