"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/admin/api";
import {
  TESTIMONIAL_SECTIONS,
  type TestimonialRow,
  type TestimonialSection,
  type TestimonialSectionAssignmentRow,
} from "@/types/testimonial";
import { useTestimonialSectionMutations } from "@/hooks/testimonials/useTestimonialSectionMutations";
import { TestimonialSectionPreview } from "@/components/admin/testimonials/TestimonialSectionPreview";

const SECTION_LABELS: Record<TestimonialSection, string> = {
  spotlight: "Spotlight",
  featured: "Featured",
  editorial: "Editorial",
};

const SECTION_HINTS: Record<TestimonialSection, string> = {
  spotlight: "A rail of stories visitors can select. Order here is the display order.",
  featured:
    "Compact video + written layout. The first video in the list is shown, plus the first 2 written testimonials.",
  editorial: "Full-width story rows. Order here is the row order.",
};

function initialOf(name: string) {
  return name.charAt(0).toUpperCase();
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        kind === "video"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {kind}
    </span>
  );
}

function SectionPanel({
  section,
  published,
  assignedIds,
  onChange,
  assignmentsBySection,
  onSave,
  onReset,
  isSaving,
}: {
  section: TestimonialSection;
  published: Array<TestimonialRow & { points: string[] }>;
  assignedIds: string[];
  onChange: (ids: string[]) => void;
  assignmentsBySection: Record<string, string[]>;
  onSave: (section: TestimonialSection, ids: string[]) => void;
  onReset: () => void;
  isSaving: boolean;
}) {
  const byId = useMemo(() => new Map(published.map((t) => [t.id, t])), [published]);
  const initial = useMemo(
    () => assignmentsBySection[section] ?? [],
    [assignmentsBySection, section],
  );
  const [search, setSearch] = useState("");

  const dirty = assignedIds.join(",") !== initial.join(",");
  const assigned = assignedIds
    .map((id) => byId.get(id))
    .filter((t): t is TestimonialRow & { points: string[] } => !!t);
  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);
  const available = published.filter((t) => !assignedSet.has(t.id));
  const s = search.toLowerCase();
  const filteredAvailable = available.filter(
    (t) => !s || t.name.toLowerCase().includes(s),
  );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= assignedIds.length) return;
    const next = [...assignedIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (id: string) =>
    onChange(assignedIds.filter((x) => x !== id));

  const add = (id: string) =>
    onChange(assignedIds.includes(id) ? assignedIds : [...assignedIds, id]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Assigned to {SECTION_LABELS[section]} ({assigned.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!dirty || isSaving}
                onClick={onReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                disabled={!dirty || isSaving}
                onClick={() => onSave(section, assignedIds)}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          {assigned.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing assigned — this section currently shows all published
              testimonials.
            </div>
          ) : (
            <ul className="divide-y rounded-md border border-border">
              {assigned.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 p-3">
                  <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {initialOf(t.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {t.name}
                  </span>
                  <KindBadge kind={t.kind} />
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === assigned.length - 1}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    title="Remove from section"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Available ({available.length})
          </h3>
          <Input
            placeholder="Search available…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm text-sm"
          />
          <ul className="divide-y rounded-md border border-border">
            {filteredAvailable.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                  {initialOf(t.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {t.name}
                </span>
                <KindBadge kind={t.kind} />
                <button
                  onClick={() => add(t.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                  title="Add to section"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))}
            {filteredAvailable.length === 0 && (
              <li className="p-4 text-center text-sm text-muted-foreground">
                No available testimonials.
              </li>
            )}
          </ul>
        </div>
      </div>

      <TestimonialSectionPreview section={section} rows={assigned} />
    </div>
  );
}

export function TestimonialSectionsManager({
  published,
}: {
  published: Array<TestimonialRow & { points: string[] }>;
}) {
  const [activeSection, setActiveSection] =
    useState<TestimonialSection>("spotlight");
  const { saveSectionAssignments } = useTestimonialSectionMutations();

  const publishedRows = useMemo(
    () => published.filter((t) => t.status === "published"),
    [published],
  );

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["testimonial-section-assignments"],
    queryFn: () =>
      adminApi
        .get<{ items: TestimonialSectionAssignmentRow[] }>("/api/admin/testimonial-sections")
        .then((data) => data.items),
  });

  const assignmentsBySection = useMemo(() => {
    const map: Record<string, string[]> = { spotlight: [], featured: [], editorial: [] };
    for (const a of assignments ?? []) {
      (map[a.section] ??= []).push(a.testimonial_id);
    }
    return map;
  }, [assignments]);

  const [drafts, setDrafts] = useState<Record<TestimonialSection, string[]>>({
    spotlight: [],
    featured: [],
    editorial: [],
  });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || isLoading) return;
    setDrafts({
      spotlight: [...(assignmentsBySection.spotlight ?? [])],
      featured: [...(assignmentsBySection.featured ?? [])],
      editorial: [...(assignmentsBySection.editorial ?? [])],
    });
    setSeeded(true);
  }, [assignmentsBySection, isLoading, seeded]);

  const handleSave = (section: TestimonialSection, ids: string[]) => {
    saveSectionAssignments.mutate({ section, ids }, {
      onSuccess: () => {
        setDrafts((prev) => ({ ...prev, [section]: ids }));
      },
    });
  };

  const handleReset = (section: TestimonialSection) => {
    setDrafts((prev) => ({
      ...prev,
      [section]: [...(assignmentsBySection[section] ?? [])],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {SECTION_HINTS[activeSection]}
      </p>
      <Tabs
        value={activeSection}
        onValueChange={(v) => setActiveSection(v as TestimonialSection)}
      >
        <TabsList>
          {TESTIMONIAL_SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {SECTION_LABELS[s]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SectionPanel
        key={activeSection}
        section={activeSection}
        published={publishedRows}
        assignedIds={drafts[activeSection]}
        onChange={(ids) =>
          setDrafts((prev) => ({ ...prev, [activeSection]: ids }))
        }
        assignmentsBySection={assignmentsBySection}
        onSave={handleSave}
        onReset={() => handleReset(activeSection)}
        isSaving={saveSectionAssignments.isPending}
      />
    </div>
  );
}
