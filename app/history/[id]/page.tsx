"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Subtraction = { element: string; reason: string };
type RamsViolation = { principle: number; name: string; explanation: string };

type ContrastPoint = {
  aspect: string;
  a_handling: string;
  b_handling: string;
  winner_on_aspect: "A" | "B" | "tie";
};
type RamsInvoked = {
  principle: number;
  name: string;
  how_it_separates: string;
};

type CaseRecord = {
  id: string;
  mode: "single" | "compare" | "addition_single" | "addition_ab";
  prd_text: string | null;
  image_urls: string[];
  report: {
    verdict: string;
    score?: number;
    score_a?: number;
    score_b?: number;
    subtractions?: Subtraction[];
    rams_violations?: RamsViolation[];
    contrast_points?: ContrastPoint[];
    rams_principles_invoked?: RamsInvoked[];
    winner?: "A" | "B";
    compatibility_note?: string;
  };
  feedback: "agree" | "partial" | "disagree" | null;
  feedback_note: string | null;
  reference_marked: boolean;
  created_at: number;
};

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { locale, d } = useI18n();
  const { id } = use(params);
  const [data, setData] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setErr(res.error);
        else setData(res.case);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-12">
        <div className="h-8 w-32 animate-pulse rounded bg-[#f5f5f7]" />
      </main>
    );
  }

  if (err || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-12">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="display-hero">{d.caseNotFoundTitle}</h1>
          <Link href="/history" className="text-sm text-[#6e6e73]">
            {d.backToHistory}
          </Link>
        </header>
        <p className="text-sm text-red-600">{err ?? d.caseNotFound}</p>
      </main>
    );
  }

  const date = new Date(data.created_at).toLocaleString(
    locale === "en" ? "en-US" : "zh-CN",
  );
  const r = data.report;

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 pt-12 animate-fade-up">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="display-hero">{d.caseDetailTitle}</h1>
        <Link
          href="/history"
          className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
        >
          {d.backToHistory}
        </Link>
      </header>

      {/* Meta */}
      <section className="mb-8 flex flex-wrap items-center gap-3 text-xs text-[#86868b]">
        <span className="rounded-full bg-[#f5f5f7] px-3 py-1 font-medium text-[#1d1d1f]">
          {d.modeLabels[data.mode]}
        </span>
        <span>{date}</span>
        {data.reference_marked && (
          <span className="rounded-full bg-[#fff8e6] px-3 py-1 text-[#8a5a00]">
            {d.referenceMarked}
          </span>
        )}
      </section>

      {/* Images */}
      <section className="mb-10">
        <p className="section-label mb-3">{d.compareLabel}</p>
        <div className="flex flex-wrap gap-3">
          {data.image_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="max-h-[400px] rounded-2xl border border-[#e5e5ea] shadow-sm"
            />
          ))}
        </div>
      </section>

      {/* PRD context */}
      {data.prd_text && (
        <section className="mb-10">
          <p className="section-label mb-3">{d.prdContextTitle}</p>
          <pre className="whitespace-pre-wrap rounded-2xl border border-[#e5e5ea] bg-[#fafafa] p-4 text-xs leading-relaxed text-[#6e6e73]">
            {data.prd_text}
          </pre>
        </section>
      )}

      {/* Scores */}
      {(r.score !== undefined ||
        (r.score_a !== undefined && r.score_b !== undefined)) && (
        <section className="mb-10">
          <p className="section-label mb-3">{d.scoreSectionTitle}</p>
          {r.score !== undefined ? (
            <div className="inline-flex items-baseline gap-3">
              <span className="text-[56px] font-semibold leading-none tracking-tight text-[#1d1d1f]">
                {r.score}
              </span>
              <span className="text-sm text-[#86868b]">
                {d.scoreLabelFn(r.score)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-8">
              <div>
                <p className="mb-1 text-xs text-[#86868b]">{d.labelImageA}</p>
                <span className="text-[40px] font-semibold leading-none tracking-tight text-[#1d1d1f]">
                  {r.score_a}
                </span>
              </div>
              <span className="text-xl text-[#d2d2d7]">vs</span>
              <div>
                <p className="mb-1 text-xs text-[#86868b]">{d.labelImageB}</p>
                <span className="text-[40px] font-semibold leading-none tracking-tight text-[#1d1d1f]">
                  {r.score_b}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Verdict */}
      <section className="mb-10">
        <p className="section-label mb-3">{d.oneLineVerdictTitle}</p>
        {r.winner && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-1.5 text-sm font-medium text-white">
            <span className="text-xs text-white/60">{d.winnerBadge}</span>
            <span>{d.imageOf(r.winner)}</span>
          </div>
        )}
        <p className="display-verdict">{r.verdict}</p>
      </section>

      {/* Compatibility (新增模块单方案) */}
      {r.compatibility_note && (
        <section className="mb-10">
          <p className="section-label mb-3">{d.compatibilityTitle}</p>
          <p className="text-base leading-relaxed text-[#1d1d1f]">
            {r.compatibility_note}
          </p>
        </section>
      )}

      {/* Subtractions */}
      {r.subtractions && r.subtractions.length > 0 && (
        <section className="mb-10">
          <p className="section-label mb-4">{d.subtractionsTitle}</p>
          <ul className="space-y-3">
            {r.subtractions.map((s, i) => (
              <li
                key={i}
                className="rounded-2xl border border-[#e5e5ea] bg-white p-5"
              >
                <p className="text-base font-medium tracking-tight text-[#1d1d1f]">
                  {s.element}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                  {s.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contrast points (compare / addition_ab) */}
      {r.contrast_points && r.contrast_points.length > 0 && (
        <section className="mb-10">
          <p className="section-label mb-4">{d.contrastTableTitle}</p>
          <div className="overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#fafafa] text-xs text-[#86868b]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    {d.contrastColDimension}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {d.contrastColA}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {d.contrastColB}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea]">
                {r.contrast_points.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 align-top font-medium text-[#1d1d1f]">
                      {p.aspect}
                    </td>
                    <td
                      className={`px-4 py-3 align-top text-[#1d1d1f] ${p.winner_on_aspect === "A" ? "bg-[#fff8e6]" : ""}`}
                    >
                      {p.a_handling}
                    </td>
                    <td
                      className={`px-4 py-3 align-top text-[#1d1d1f] ${p.winner_on_aspect === "B" ? "bg-[#fff8e6]" : ""}`}
                    >
                      {p.b_handling}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rams violations */}
      {r.rams_violations && r.rams_violations.length > 0 && (
        <section className="mb-10">
          <p className="section-label mb-4">{d.ramsViolationsTitle}</p>
          <ul className="space-y-3">
            {r.rams_violations.map((v) => (
              <li
                key={v.principle}
                className="text-sm leading-relaxed text-[#6e6e73]"
              >
                <span className="font-medium text-[#1d1d1f]">
                  {d.principleLine(v.principle, v.name)}
                </span>
                <span className="mx-1.5 text-[#d2d2d7]">·</span>
                {v.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rams principles invoked (compare) */}
      {r.rams_principles_invoked && r.rams_principles_invoked.length > 0 && (
        <section className="mb-10">
          <p className="section-label mb-4">{d.ramsInvokedTitle}</p>
          <ul className="space-y-3">
            {r.rams_principles_invoked.map((p) => (
              <li
                key={p.principle}
                className="text-sm leading-relaxed text-[#6e6e73]"
              >
                <span className="font-medium text-[#1d1d1f]">
                  {d.principleLine(p.principle, p.name)}
                </span>
                <span className="mx-1.5 text-[#d2d2d7]">·</span>
                {p.how_it_separates}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Feedback already saved */}
      {data.feedback && (
        <section className="rounded-2xl border border-[#e5e5ea] bg-[#fafafa] p-5">
          <p className="section-label mb-2">{d.feedbackTitle}</p>
          <p className="mb-2 text-sm font-medium text-[#1d1d1f]">
            {data.feedback === "agree" && d.feedbackAgree}
            {data.feedback === "partial" && d.feedbackPartial}
            {data.feedback === "disagree" && d.feedbackDisagree}
          </p>
          {data.feedback_note && (
            <p className="text-sm leading-relaxed text-[#6e6e73]">
              {data.feedback_note}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
