"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type CaseRecord = {
  id: string;
  mode: "single" | "compare" | "addition_single" | "addition_ab";
  image_urls: string[];
  report: {
    verdict?: string;
    score?: number;
    score_a?: number;
    score_b?: number;
  };
  feedback: "agree" | "partial" | "disagree" | null;
  feedback_note: string | null;
  reference_marked: boolean;
  created_at: number;
};

type FilterFeedback = "all" | "agree" | "partial" | "disagree" | "null";

export default function HistoryPage() {
  const { d } = useI18n();
  const [items, setItems] = useState<CaseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FilterFeedback>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (feedback !== "all") params.set("feedback", feedback);
    setLoading(true);
    fetch(`/api/history?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [feedback]);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 pt-12">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="display-hero">{d.historyTitle}</h1>
        <Link
          href="/"
          className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
        >
          {d.backToReview}
        </Link>
      </header>

      {/* Filters */}
      <section className="mb-8 flex flex-wrap items-center gap-3">
        <FilterGroup
          label={d.filterFeedbackLabel}
          value={feedback}
          options={[
            ["all", d.filterAll],
            ["agree", d.filterAgree],
            ["partial", d.filterPartial],
            ["disagree", d.filterDisagree],
            ["null", d.filterUnrated],
          ]}
          onChange={(v) => setFeedback(v as FilterFeedback)}
        />
      </section>

      {/* Result count */}
      <p className="mb-4 text-xs text-[#86868b]">
        {d.resultCount(total)}
        {loading ? d.loadingSuffix : ""}
      </p>

      {/* List */}
      {loading && items.length === 0 ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3 animate-fade-up">
          {items.map((item) => (
            <CaseRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#86868b]">{label}</span>
      <div className="inline-flex gap-1 rounded-full bg-[#f5f5f7] p-1">
        {options.map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
              value === val
                ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseRow({ item }: { item: CaseRecord }) {
  const { locale, d } = useI18n();
  const date = new Date(item.created_at).toLocaleString(
    locale === "en" ? "en-US" : "zh-CN",
    {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const feedbackLabel: Record<string, string> = {
    agree: d.feedbackAgree,
    partial: d.feedbackPartial,
    disagree: d.feedbackDisagree,
  };

  const score =
    item.report.score ??
    (item.report.score_a !== undefined && item.report.score_b !== undefined
      ? Math.max(item.report.score_a, item.report.score_b)
      : undefined);

  return (
    <li>
      <Link
        href={`/history/${item.id}`}
        className="flex gap-4 rounded-2xl border border-[#e5e5ea] bg-white p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
      >
        {/* Thumbnails */}
        <div className="flex shrink-0 gap-1.5">
          {item.image_urls.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-16 w-12 rounded-lg object-cover"
            />
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-[#86868b]">
            <span className="font-medium text-[#1d1d1f]">
              {d.modeLabels[item.mode]}
            </span>
            <span>·</span>
            <span>{date}</span>
            {item.reference_marked && (
              <>
                <span>·</span>
                <span className="text-[#8a5a00]">{d.referenceMarked}</span>
              </>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#1d1d1f]">
            {item.report.verdict ?? d.noVerdictText}
          </p>
        </div>

        {/* Score + Feedback badges */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {score !== undefined && (
            <span className="inline-flex items-baseline gap-1 text-lg font-semibold tracking-tight text-[#1d1d1f]">
              {score}
            </span>
          )}
          {item.feedback && (
            <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs text-[#6e6e73]">
              {feedbackLabel[item.feedback]}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-[#f5f5f7]"
        />
      ))}
    </ul>
  );
}

function EmptyState() {
  const { d } = useI18n();
  return (
    <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-12 text-center">
      <p className="text-sm text-[#6e6e73]">{d.emptyHistory}</p>
    </div>
  );
}
