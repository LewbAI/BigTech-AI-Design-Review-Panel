"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { useI18n, type Dict } from "@/lib/i18n";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type Dissenter = { name: string; reason: string };
type VoteInfo = {
  agree: string[];
  dissenters: Dissenter[];
};
type Subtraction = {
  element: string;
  reason: string;
  votes?: VoteInfo | string;
};

// v4.0.5 新格式
type Highlight = {
  headline: string;
  principle_ref?: string;
  body: string;
};
type Improvement = {
  headline: string;
  body: string;
  principle_ref?: string;
};
type ScoreDimension = {
  name: string;
  score: number;
  max: number;
};
type RamsViolation = { principle: number; name: string; explanation: string };

// v4.0 评审团相关
type PanelMember = {
  name: string;
  role: string;
  comment: string;
};
type KeyDebate = {
  topic: string;
  side_a: { persona: string; argument: string };
  side_b: { persona: string; argument: string };
  resolution: string;
};
type ScoreBreakdown = {
  foundation?: number;
  panel_average?: number;
  info_bonus?: number;
};

type Report = {
  // v4.0.5 新格式
  subject_guess?: string;
  summary?: string;
  highlights?: Highlight[];
  improvements?: Improvement[];
  dimensions?: ScoreDimension[];

  // 通用
  score?: number;
  score_label?: string;
  panel?: PanelMember[];
  key_debates?: KeyDebate[];

  // 兼容旧
  score_breakdown?: ScoreBreakdown;
  verdict?: string;
  subtractions?: Subtraction[];
  rams_violations?: RamsViolation[];
};

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
type Comparison = {
  winner: "A" | "B";
  score_a?: number;
  score_b?: number;
  verdict: string;
  panel?: PanelMember[];
  key_debates?: KeyDebate[];
  contrast_points: ContrastPoint[];
  rams_principles_invoked?: RamsInvoked[];
};

type AdditionSingleResult = {
  // v4.0.5
  subject_guess?: string;
  summary?: string;
  highlights?: Highlight[];
  improvements?: Improvement[];
  dimensions?: ScoreDimension[];

  compatibility_note?: string;
  score?: number;
  score_label?: string;
  panel?: PanelMember[];
  key_debates?: KeyDebate[];

  // 兼容旧
  score_breakdown?: ScoreBreakdown;
  verdict?: string;
  subtractions?: Subtraction[];
  rams_violations?: RamsViolation[];
};

type Mode = "single" | "compare" | "addition";

// ────────────────────────────────────────────
// Page
// ────────────────────────────────────────────

export default function Home() {
  const { locale, toggleLocale, d } = useI18n();
  const [mode, setMode] = useState<Mode>("single");

  // single
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // compare
  const [fileA, setFileA] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  // addition
  const [baseline, setBaseline] = useState<File | null>(null);
  const [baselinePreview, setBaselinePreview] = useState<string | null>(null);
  const [proposalA, setProposalA] = useState<File | null>(null);
  const [proposalAPreview, setProposalAPreview] = useState<string | null>(null);
  const [proposalB, setProposalB] = useState<File | null>(null);
  const [proposalBPreview, setProposalBPreview] = useState<string | null>(null);
  const [additionSingle, setAdditionSingle] =
    useState<AdditionSingleResult | null>(null);
  const [additionAB, setAdditionAB] = useState<Comparison | null>(null);
  const baselineRef = useRef<HTMLInputElement>(null);
  const propARef = useRef<HTMLInputElement>(null);
  const propBRef = useRef<HTMLInputElement>(null);

  // PRD
  const [prdText, setPrdText] = useState("");
  const [prdModalOpen, setPrdModalOpen] = useState(false);

  // v4.0 评审团上下文输入
  const [persona, setPersona] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [userConcern, setUserConcern] = useState("");
  const [contextOpen, setContextOpen] = useState(false);

  // shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const [caseId, setCaseId] = useState<string | null>(null);

  // 进度模拟（异步阻塞调用，模拟"应该在哪"）
  useEffect(() => {
    if (!loading) {
      if (progress > 0) {
        setProgress(100);
        const t = setTimeout(() => {
          setProgress(0);
          setLoadingStage(0);
        }, 400);
        return () => clearTimeout(t);
      }
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      // 渐近线：0 → 95%，前快后慢
      const p = Math.min(95, 100 * (1 - Math.exp(-elapsed / 10)));
      setProgress(p);
      const stageIndex = Math.min(
        d.loadingStages.length - 1,
        Math.floor(elapsed / 4),
      );
      setLoadingStage(stageIndex);
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ────────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────────

  const submitSingle = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setCaseId(null);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("locale", locale);
    if (prdText.trim()) fd.append("prdText", prdText.trim());
    if (persona.trim()) fd.append("persona", persona.trim());
    if (userGoal.trim()) fd.append("userGoal", userGoal.trim());
    if (userConcern.trim()) fd.append("userConcern", userConcern.trim());
    try {
      const res = await fetch("/api/review", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error || d.errGeneric);
      else {
        setReport(data.report);
        setCaseId(data.case_id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  const submitCompare = async () => {
    if (!fileA || !fileB) return;
    setLoading(true);
    setError(null);
    setComparison(null);
    setCaseId(null);
    const fd = new FormData();
    fd.append("imageA", fileA);
    fd.append("imageB", fileB);
    fd.append("locale", locale);
    if (prdText.trim()) fd.append("prdText", prdText.trim());
    if (persona.trim()) fd.append("persona", persona.trim());
    if (userGoal.trim()) fd.append("userGoal", userGoal.trim());
    if (userConcern.trim()) fd.append("userConcern", userConcern.trim());
    try {
      const res = await fetch("/api/compare", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error || d.errGeneric);
      else {
        setComparison(data.comparison);
        setCaseId(data.case_id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  const submitAddition = async () => {
    if (!baseline || !proposalA) return;
    setLoading(true);
    setError(null);
    setAdditionSingle(null);
    setAdditionAB(null);
    setCaseId(null);
    const fd = new FormData();
    fd.append("baseline", baseline);
    fd.append("proposalA", proposalA);
    fd.append("locale", locale);
    if (proposalB) fd.append("proposalB", proposalB);
    if (prdText.trim()) fd.append("prdText", prdText.trim());
    if (persona.trim()) fd.append("persona", persona.trim());
    if (userGoal.trim()) fd.append("userGoal", userGoal.trim());
    if (userConcern.trim()) fd.append("userConcern", userConcern.trim());
    try {
      const res = await fetch("/api/addition", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || d.errGeneric);
      } else if (data.mode === "ab") {
        setAdditionAB(data.result);
        setCaseId(data.case_id ?? null);
      } else {
        setAdditionSingle(data.result);
        setCaseId(data.case_id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    (mode === "single" && !file) ||
    (mode === "compare" && (!fileA || !fileB)) ||
    (mode === "addition" && (!baseline || !proposalA));

  const submitLabel = (() => {
    if (loading) return d.submitLoading;
    if (mode === "compare") return d.submitCompare;
    if (mode === "addition") return proposalB ? d.submitCompareAB : d.submitReview;
    return d.submitReview;
  })();

  const submit = () => {
    if (mode === "single") submitSingle();
    else if (mode === "compare") submitCompare();
    else submitAddition();
  };

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 pt-12">
      {/* Compact Hero */}
      <header className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="display-hero">{d.brandName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-xs font-medium text-[#6e6e73] transition-colors hover:border-[#86868b] hover:text-[#1d1d1f]"
          >
            {locale === "zh" ? "中文 / EN" : "EN / 中文"}
          </button>
          <Link
            href="/history"
            className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
          >
            {d.historyLink}
          </Link>
        </div>
      </header>

      {/* Tab — Apple-style segmented pill */}
      <nav className="mb-6">
        <div className="inline-flex gap-1 rounded-full bg-[#f5f5f7] p-1">
          {(
            [
              ["single", d.tabSingle],
              ["compare", d.tabCompare],
              ["addition", d.tabAddition],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                mode === id
                  ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mode-specific upload */}
      {mode === "single" && (
        <section className="mb-6 animate-fade-in">
          <DropZone
            preview={preview}
            onFile={(f) => {
              setFile(f);
              setPreview(URL.createObjectURL(f));
              setReport(null);
              setError(null);
            }}
            inputRef={inputRef}
            placeholder={d.dropzoneSingle}
            maxHeight={320}
          />
        </section>
      )}

      {mode === "compare" && (
        <section className="mb-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <SlotWithLabel label={d.labelImageA}>
              <DropZone
                preview={previewA}
                onFile={(f) => {
                  setFileA(f);
                  setPreviewA(URL.createObjectURL(f));
                  setComparison(null);
                  setError(null);
                }}
                inputRef={inputARef}
                placeholder={d.dropzoneA}
                maxHeight={280}
              />
            </SlotWithLabel>
            <SlotWithLabel label={d.labelImageB}>
              <DropZone
                preview={previewB}
                onFile={(f) => {
                  setFileB(f);
                  setPreviewB(URL.createObjectURL(f));
                  setComparison(null);
                  setError(null);
                }}
                inputRef={inputBRef}
                placeholder={d.dropzoneB}
                maxHeight={280}
              />
            </SlotWithLabel>
          </div>
        </section>
      )}

      {mode === "addition" && (
        <section className="mb-6 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            <SlotWithLabel label={d.labelBaseline} required requiredTag={d.requiredTag}>
              <DropZone
                preview={baselinePreview}
                onFile={(f) => {
                  setBaseline(f);
                  setBaselinePreview(URL.createObjectURL(f));
                  setAdditionSingle(null);
                  setAdditionAB(null);
                  setError(null);
                }}
                inputRef={baselineRef}
                placeholder={d.dropzoneBaseline}
                maxHeight={220}
              />
            </SlotWithLabel>
            <SlotWithLabel label={d.labelProposalA} required requiredTag={d.requiredTag}>
              <DropZone
                preview={proposalAPreview}
                onFile={(f) => {
                  setProposalA(f);
                  setProposalAPreview(URL.createObjectURL(f));
                  setAdditionSingle(null);
                  setAdditionAB(null);
                  setError(null);
                }}
                inputRef={propARef}
                placeholder={d.dropzoneProposalA}
                maxHeight={220}
              />
            </SlotWithLabel>
            <SlotWithLabel label={d.labelProposalB} optional optionalTag={d.optionalTag}>
              <DropZone
                preview={proposalBPreview}
                onFile={(f) => {
                  setProposalB(f);
                  setProposalBPreview(URL.createObjectURL(f));
                  setAdditionSingle(null);
                  setAdditionAB(null);
                  setError(null);
                }}
                inputRef={propBRef}
                placeholder={d.dropzoneProposalB}
                maxHeight={220}
                weakened={!proposalBPreview}
              />
            </SlotWithLabel>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-[#86868b]">
            {d.additionHintPart1}
            <span className="mx-1.5 text-[#d2d2d7]">·</span>
            {d.additionHintPart2}
          </p>
        </section>
      )}

      {/* Inline toolbar：PRD + 评审上下文 */}
      <section className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPrdModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
            prdText
              ? "border-[#1d1d1f] bg-[#1d1d1f] text-white"
              : "border-dashed border-[#d2d2d7] bg-white text-[#6e6e73] hover:border-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          {prdText ? (
            <>
              <span>{d.prdButtonLabel}</span>
              <span className="text-white/60">
                {d.prdCharSuffix(prdText.length)}
              </span>
            </>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              <span>{d.prdButtonLabel}</span>
              <span className="text-[#86868b]">{d.optionalTag}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
            persona || userGoal || userConcern
              ? "border-[#1d1d1f] bg-[#1d1d1f] text-white"
              : "border-dashed border-[#d2d2d7] bg-white text-[#6e6e73] hover:border-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          {persona || userGoal || userConcern ? (
            <>
              <span>{d.contextButtonLabel}</span>
              <span className="text-white/60">
                {d.contextFilledSuffix(
                  [persona, userGoal, userConcern].filter(Boolean).length,
                )}
              </span>
            </>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              <span>{d.contextButtonLabel}</span>
              <span className="text-[#86868b]">{d.contextButtonHint}</span>
            </>
          )}
        </button>
      </section>

      {/* 评审上下文输入面板（点开才显示）*/}
      {contextOpen && (
        <section className="mb-6 animate-fade-in rounded-2xl border border-[#e5e5ea] bg-white p-5">
          <p className="mb-1 text-sm font-medium tracking-tight text-[#1d1d1f]">
            {d.contextPanelTitle}
          </p>
          <p className="mb-4 text-xs leading-relaxed text-[#6e6e73]">
            {d.contextPanelDesc}
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#1d1d1f]">
                {d.personaLabel}
                <span className="ml-2 text-[#86868b]">{d.personaHint}</span>
              </label>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                rows={2}
                placeholder={d.personaPlaceholder}
                className="w-full resize-none rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#86868b]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#1d1d1f]">
                {d.goalLabel}
                <span className="ml-2 text-[#86868b]">{d.goalHint}</span>
              </label>
              <input
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder={d.goalPlaceholder}
                className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#86868b]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#1d1d1f]">
                {d.concernLabel}
                <span className="ml-2 text-[#86868b]">{d.concernHint}</span>
              </label>
              <input
                value={userConcern}
                onChange={(e) => setUserConcern(e.target.value)}
                placeholder={d.concernPlaceholder}
                className="w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#86868b]"
              />
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mb-10">
        <button
          onClick={submit}
          disabled={submitDisabled}
          className="w-full rounded-full bg-[#c20c0c] py-3.5 text-base font-medium tracking-tight text-white transition-all duration-200 hover:bg-[#a00a0a] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#d2d2d7] disabled:text-white"
        >
          {submitLabel}
        </button>
      </section>

      {/* Loading state — progress + stage + skeleton */}
      {loading && (
        <section className="mb-10 animate-fade-in space-y-6">
          <div className="space-y-3">
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#e5e5ea]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#1d1d1f] transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p
              key={loadingStage}
              className="animate-fade-in text-sm text-[#6e6e73]"
            >
              {d.loadingStages[loadingStage]}
            </p>
          </div>
          <SkeletonReport />
        </section>
      )}

      {/* Error */}
      {error && !loading && (
        error === "auth_403" ? (
          <AuthErrorGuide />
        ) : (
          <section className="mb-10 animate-fade-in rounded-2xl border border-red-100 bg-red-50/60 p-5 text-sm leading-relaxed text-red-700">
            {error}
          </section>
        )
      )}

      {/* Results */}
      {!loading && mode === "single" && report && (
        <div className="animate-fade-up">
          <SingleReport
            report={report}
            images={preview ? [{ url: preview, label: d.imgLabelDesign }] : []}
          />
        </div>
      )}
      {!loading && mode === "compare" && comparison && (
        <div className="animate-fade-up">
          <CompareReport
            comparison={comparison}
            images={[
              ...(previewA ? [{ url: previewA, label: d.labelImageA }] : []),
              ...(previewB ? [{ url: previewB, label: d.labelImageB }] : []),
            ]}
          />
        </div>
      )}
      {!loading && mode === "addition" && additionSingle && (
        <div className="animate-fade-up">
          <AdditionSingleReport
            report={additionSingle}
            images={[
              ...(baselinePreview
                ? [{ url: baselinePreview, label: d.imgLabelBaseline }]
                : []),
              ...(proposalAPreview
                ? [{ url: proposalAPreview, label: d.imgLabelNewModule }]
                : []),
            ]}
          />
        </div>
      )}
      {!loading && mode === "addition" && additionAB && (
        <div className="animate-fade-up">
          <CompareReport
            comparison={additionAB}
            images={[
              ...(baselinePreview
                ? [{ url: baselinePreview, label: d.imgLabelBaseline }]
                : []),
              ...(proposalAPreview
                ? [{ url: proposalAPreview, label: d.labelProposalA }]
                : []),
              ...(proposalBPreview
                ? [{ url: proposalBPreview, label: d.labelProposalB }]
                : []),
            ]}
          />
        </div>
      )}

      {/* Feedback */}
      {!loading && caseId && (report || comparison || additionSingle || additionAB) && (
        <FeedbackSection caseId={caseId} />
      )}

      {/* PRD Modal */}
      {prdModalOpen && (
        <PrdModal
          prdText={prdText}
          onChange={setPrdText}
          onClose={() => setPrdModalOpen(false)}
          onError={setError}
        />
      )}
    </main>
  );
}

// ────────────────────────────────────────────
// Auth error guide (missing / invalid API key, or blocked 403)
// ────────────────────────────────────────────

function AuthErrorGuide() {
  const { d } = useI18n();
  return (
    <section className="mb-10 animate-fade-in rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
      <p className="mb-3 text-base font-semibold text-[#8a5a00]">
        {d.err403Title}
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#6e6e73]">
        {d.err403Steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

// ────────────────────────────────────────────
// Feedback Section
// ────────────────────────────────────────────

type FeedbackVal = "agree" | "partial" | "disagree" | null;

function FeedbackSection({ caseId }: { caseId: string }) {
  const { d } = useI18n();
  const [feedback, setFeedback] = useState<FeedbackVal>(null);
  const [note, setNote] = useState("");
  const [marked, setMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 新案例切换时重置
  useEffect(() => {
    setFeedback(null);
    setNote("");
    setMarked(false);
    setSaved(false);
  }, [caseId]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          feedback,
          feedback_note: note.trim() || null,
          reference_marked: marked,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-16 rounded-2xl border border-[#e5e5ea] bg-white p-7 animate-fade-up">
      <p className="section-label mb-4">{d.feedbackTitle}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["agree", d.feedbackAgree],
            ["partial", d.feedbackPartial],
            ["disagree", d.feedbackDisagree],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              setFeedback(val);
              setSaved(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              feedback === val
                ? "bg-[#1d1d1f] text-white"
                : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <textarea
        placeholder={d.feedbackNotePlaceholder}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        rows={3}
        className="w-full resize-y rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 text-sm leading-relaxed text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#86868b]"
      />

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[#6e6e73]">
        <input
          type="checkbox"
          checked={marked}
          onChange={(e) => {
            setMarked(e.target.checked);
            setSaved(false);
          }}
          className="h-4 w-4 cursor-pointer"
        />
        {d.feedbackMarkReference}
        <span className="text-xs text-[#86868b]">
          {d.feedbackMarkReferenceHint}
        </span>
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!feedback || saving}
          className="rounded-full bg-[#1d1d1f] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d2d2d7]"
        >
          {saving ? d.feedbackSaving : saved ? d.feedbackSaved : d.feedbackSaveBtn}
        </button>
        {saved && (
          <span className="text-xs text-[#6e6e73]">{d.feedbackSavedNote}</span>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────
// PRD Modal
// ────────────────────────────────────────────

function PrdModal({
  prdText,
  onChange,
  onClose,
  onError,
}: {
  prdText: string;
  onChange: (t: string) => void;
  onClose: () => void;
  onError: (msg: string | null) => void;
}) {
  const { d } = useI18n();
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFile = async (file: File) => {
    setExtracting(true);
    onError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/prd-extract", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) onError(data.error || d.errPrdParse);
      else onChange(data.text);
    } catch (e) {
      onError(e instanceof Error ? e.message : d.errPrdParse);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/30 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl animate-modal-in rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">
              {d.prdModalTitle}
            </h2>
            <p className="mt-1 text-sm text-[#6e6e73]">{d.prdModalDesc}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
            aria-label={d.closeAria}
          >
            <span className="block h-4 w-4 leading-none">✕</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-[#6e6e73]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              {extracting ? d.prdExtracting : d.prdChooseFile}
            </button>
            <span>{d.prdOrPaste}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.md,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
          <textarea
            value={prdText}
            onChange={(e) => onChange(e.target.value)}
            placeholder={d.prdTextareaPlaceholder}
            rows={8}
            className="w-full resize-y rounded-2xl border border-[#d2d2d7] bg-white px-4 py-3 text-sm leading-relaxed text-[#1d1d1f] transition-colors placeholder:text-[#86868b] focus:border-[#86868b]"
          />
          {prdText && (
            <p className="text-xs text-[#86868b]">
              {d.prdCharCount(prdText.length)}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {prdText && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex-1 rounded-full border border-[#d2d2d7] py-2.5 text-sm text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
            >
              {d.prdClear}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] rounded-full bg-[#1d1d1f] py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            {d.prdDone}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────

function SlotWithLabel({
  label,
  required,
  optional,
  requiredTag,
  optionalTag,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  requiredTag?: string;
  optionalTag?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2">
        <span className="section-label">{label}</span>
        {required && <span className="text-xs text-[#c20c0c]">{requiredTag}</span>}
        {optional && <span className="text-xs text-[#86868b]">{optionalTag}</span>}
      </p>
      {children}
    </div>
  );
}

function DropZone({
  preview,
  onFile,
  inputRef,
  placeholder,
  maxHeight,
  weakened,
}: {
  preview: string | null;
  onFile: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  maxHeight: number;
  weakened?: boolean;
}) {
  const { d } = useI18n();
  const [dragOver, setDragOver] = useState(false);

  const baseClass =
    "group cursor-pointer rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-300";
  const styleClass = weakened
    ? "border-[#e5e5ea] bg-white/40 text-[#86868b] hover:border-[#d2d2d7] hover:bg-white/70"
    : dragOver
      ? "border-[#1d1d1f] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
      : "border-[#d2d2d7] bg-white text-[#6e6e73] hover:border-[#86868b] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]";

  return (
    <div
      className={`${baseClass} ${styleClass}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={d.previewAlt}
          className="mx-auto rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
          style={{ maxHeight: `${maxHeight}px` }}
        />
      ) : (
        <p className="text-sm leading-relaxed">{placeholder}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label mb-4">{children}</p>;
}

// ────────────────────────────────────────────
// Skeleton (loading placeholder)
// ────────────────────────────────────────────

function SkeletonReport() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-7 w-4/5" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/5" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Reports
// ────────────────────────────────────────────

function ScoreBadge({
  score,
  label,
  size = "lg",
}: {
  score: number;
  label?: string;
  size?: "lg" | "md";
}) {
  const { d } = useI18n();
  const numberCls =
    size === "lg"
      ? "text-[64px] leading-none"
      : "text-[40px] leading-none";
  return (
    <div className="inline-flex items-baseline gap-3">
      <span className={`${numberCls} font-semibold tracking-tight text-[#1d1d1f]`}>
        {score}
      </span>
      <span className="text-sm text-[#86868b]">
        {label ?? d.scoreLabelFn(score)}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────
// v4.0 评审团组件
// ────────────────────────────────────────────

const PANEL_AVATAR: Record<string, string> = {
  "Jony Ive": "🎨",
  "Don Norman": "🧠",
  "张小龙": "🐧",
  "Zhang Xiaolong": "🐧",
  "Steve Jobs": "🍎",
  "Elon Musk": "🚀",
  // 兼容旧记录
  "Apple 设计总监": "🎨",
  "乔布斯": "🍎",
};

// 评委顺序（用于 votes 头像行渲染）——中文名会随 locale 变化，其余人名中英一致
function panelOrder(locale: "zh" | "en"): string[] {
  return [
    "Jony Ive",
    "Don Norman",
    locale === "en" ? "Zhang Xiaolong" : "张小龙",
    "Steve Jobs",
    "Elon Musk",
  ];
}

function PanelCards({ panel }: { panel: PanelMember[] }) {
  const { d } = useI18n();
  return (
    <section>
      <SectionLabel>{d.panelHeading(panel.length)}</SectionLabel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {panel.map((m, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#e5e5ea] bg-white px-5 py-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">
                {PANEL_AVATAR[m.name] ?? "🎙"}
              </span>
              <div>
                <p className="text-sm font-medium tracking-tight text-[#1d1d1f]">
                  {m.name}
                </p>
                <p className="text-xs text-[#86868b]">{m.role}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#1d1d1f]">
              {m.comment}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function KeyDebates({ debates }: { debates: KeyDebate[] }) {
  const { d } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section>
      <SectionLabel>{d.debatesHeading(debates.length)}</SectionLabel>
      <ul className="space-y-3">
        {debates.map((deb, i) => {
          const open = openIdx === i;
          return (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#fafafa]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-600">⚡</span>
                  <span className="text-sm font-medium tracking-tight text-[#1d1d1f]">
                    {deb.topic}
                  </span>
                </span>
                <span className="text-xs text-[#86868b]">
                  {open ? d.debateCollapse : d.debateExpand}
                </span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-[#e5e5ea] bg-[#fafafa] px-5 py-4 animate-fade-in">
                  <div className="rounded-xl bg-white p-3">
                    <p className="mb-1 text-xs font-medium text-[#1d1d1f]">
                      {deb.side_a.persona}
                    </p>
                    <p className="text-sm leading-relaxed text-[#6e6e73]">
                      {deb.side_a.argument}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="mb-1 text-xs font-medium text-[#1d1d1f]">
                      {deb.side_b.persona}
                    </p>
                    <p className="text-sm leading-relaxed text-[#6e6e73]">
                      {deb.side_b.argument}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#1d1d1f] bg-[#1d1d1f] p-3 text-white">
                    <p className="mb-1 text-xs font-medium text-white/70">
                      {d.chairmanVerdict}
                    </p>
                    <p className="text-sm leading-relaxed">{deb.resolution}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function VoteRow({ votes }: { votes: VoteInfo }) {
  const { locale, d } = useI18n();
  const totalAgree = votes.agree.length;
  const isUnanimous = totalAgree === 5;
  return (
    <div className="mt-4 border-t border-[#e5e5ea] pt-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex gap-1.5">
          {panelOrder(locale).map((name) => {
            const agreed = votes.agree.includes(name);
            return (
              <div
                key={name}
                title={`${name} · ${agreed ? d.voteAgreeTitle : d.voteDisagreeTitle}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all ${
                  agreed
                    ? "bg-[#1d1d1f]"
                    : "bg-[#f5f5f7] opacity-40 grayscale"
                }`}
              >
                {PANEL_AVATAR[name] ?? "🎙"}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-medium text-[#1d1d1f]">
          {isUnanimous ? d.voteUnanimous : d.voteCount(totalAgree)}
        </span>
      </div>

      {votes.dissenters.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-xl bg-[#fafafa] px-4 py-3">
          {votes.dissenters.map((ds) => (
            <li
              key={ds.name}
              className="text-sm leading-relaxed text-[#6e6e73]"
            >
              <span className="mr-1">{PANEL_AVATAR[ds.name] ?? "🎙"}</span>
              <span className="font-medium text-[#1d1d1f]">{ds.name}</span>{" "}
              {d.voteDissentPrefix}
              <span>{ds.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubtractionItem({ s }: { s: Subtraction }) {
  // 检测是结构化 votes 还是旧字符串
  const isStructured =
    s.votes && typeof s.votes === "object" && "agree" in s.votes;
  return (
    <li className="rounded-2xl border border-[#e5e5ea] bg-white px-6 py-5 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <p className="text-base font-medium tracking-tight text-[#1d1d1f]">
        {s.element}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">{s.reason}</p>

      {isStructured && <VoteRow votes={s.votes as VoteInfo} />}

      {/* 旧字符串格式兼容（不应该再出现，但保留以防） */}
      {s.votes && typeof s.votes === "string" && (
        <p className="mt-3 text-xs text-[#86868b]">{s.votes}</p>
      )}
    </li>
  );
}

function ReportTitle({
  subjectGuess,
  score,
  scoreLabel,
}: {
  subjectGuess?: string;
  score?: number;
  scoreLabel?: string;
}) {
  const { d } = useI18n();
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <p className="mb-3 text-sm uppercase tracking-widest text-[#86868b]">
        {d.brandName}
      </p>
      <h2 className="text-[34px] font-bold leading-[1.1] tracking-tight text-[#1d1d1f] md:text-[48px]">
        {subjectGuess ?? d.unnamedDesign}
      </h2>
      {score !== undefined && (
        <div className="mt-8 flex items-baseline gap-4">
          <span className="text-[104px] font-bold leading-none tracking-tighter text-[#1d1d1f]">
            {score}
          </span>
          <span className="text-2xl text-[#86868b]">{d.outOf100}</span>
          {scoreLabel && (
            <span className="ml-2 rounded-full bg-[#1d1d1f] px-4 py-1.5 text-base font-semibold text-white">
              {scoreLabel}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <p className="text-[26px] font-semibold leading-[1.5] tracking-tight text-[#1d1d1f] md:text-[30px] md:leading-[1.45]">
        {summary}
      </p>
    </section>
  );
}

function HighlightsSection({ items }: { items: Highlight[] }) {
  const { d } = useI18n();
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <h3 className="mb-6 text-xl font-semibold tracking-tight text-[#1d1d1f]">
        {d.highlightsTitle}
      </h3>
      <div className="space-y-5">
        {items.map((h, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#e5e5ea] bg-white p-6"
          >
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
                {h.headline}
              </p>
              {h.principle_ref && (
                <span className="text-sm text-[#86868b]">
                  · {h.principle_ref}
                </span>
              )}
            </div>
            <p className="text-base leading-[1.7] text-[#1d1d1f]">{h.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImprovementsSection({ items }: { items: Improvement[] }) {
  const { d } = useI18n();
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <h3 className="mb-6 text-xl font-semibold tracking-tight text-[#1d1d1f]">
        {d.improvementsTitle}
      </h3>
      <ul className="space-y-4">
        {items.map((m, i) => (
          <li
            key={i}
            className="rounded-2xl border border-[#e5e5ea] bg-white p-5"
          >
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-base font-semibold tracking-tight text-[#1d1d1f]">
                {m.headline}
              </p>
              {m.principle_ref && (
                <span className="text-sm text-[#86868b]">
                  · {m.principle_ref}
                </span>
              )}
            </div>
            <p className="text-base leading-[1.7] text-[#6e6e73]">{m.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DimensionsTable({
  dimensions,
  total,
}: {
  dimensions: ScoreDimension[];
  total?: number;
}) {
  const { d } = useI18n();
  const sum = dimensions.reduce((a, dim) => a + dim.score, 0);
  const max = dimensions.reduce((a, dim) => a + dim.max, 0);
  const totalShown = total ?? sum;
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <h3 className="mb-6 text-xl font-semibold tracking-tight text-[#1d1d1f]">
        {d.dimensionsTitle}
      </h3>
      <div className="space-y-5">
        {dimensions.map((dim, i) => {
          const pct = Math.round((dim.score / dim.max) * 100);
          return (
            <div key={i}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-base font-medium tracking-tight text-[#1d1d1f]">
                  {dim.name}
                </span>
                <span className="text-base text-[#1d1d1f]">
                  <span className="font-semibold">{dim.score}</span>
                  <span className="ml-1 text-[#86868b]">/ {dim.max}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f7]">
                <div
                  className="h-full rounded-full bg-[#1d1d1f] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* 总分 */}
        <div className="mt-3 border-t border-[#e5e5ea] pt-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
              {d.totalScore}
            </span>
            <span className="text-lg text-[#1d1d1f]">
              <span className="font-semibold">{totalShown}</span>
              <span className="ml-1 text-[#86868b]">/ {max}</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f5f5f7]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all"
              style={{ width: `${Math.round((totalShown / max) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────
// 导出相关
// ────────────────────────────────────────────

type ReportImage = { url: string; label: string };

function ImageStrip({ images }: { images: ReportImage[] }) {
  const { d } = useI18n();
  if (!images.length) return null;
  return (
    <section className="border-b border-[#e5e5ea] pb-10">
      <p className="mb-4 text-sm uppercase tracking-widest text-[#86868b]">
        {d.reviewedImagesTitle}
      </p>
      <div className="flex flex-wrap gap-4">
        {images.map((img, i) => (
          <figure key={i} className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.label}
              className="max-h-[360px] rounded-xl border border-[#e5e5ea] object-contain shadow-sm"
            />
            <figcaption className="text-xs text-[#86868b]">
              {img.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function generateMarkdown(report: Report, d: Dict): string {
  const L: string[] = [];
  const title = report.subject_guess ?? d.mdDefaultTitle;
  const score = report.score ?? "";
  L.push(`# ${title} · ${d.mdSingleSuffix} · ${score}`);
  if (report.score_label) L.push(`**${report.score_label}**`);
  if (report.summary) L.push("", "> " + report.summary);

  if (report.highlights?.length) {
    L.push("", `## ${d.mdHighlightsHeading}`, "");
    for (const h of report.highlights) {
      L.push(
        `### ${h.headline}${h.principle_ref ? ` · ${h.principle_ref}` : ""}`,
      );
      L.push(h.body, "");
    }
  }
  if (report.improvements?.length) {
    L.push(`## ${d.mdImprovementsHeading}`, "");
    for (const m of report.improvements) {
      L.push(
        `- **${m.headline}**：${m.body}${m.principle_ref ? ` · ${m.principle_ref}` : ""}`,
      );
    }
    L.push("");
  }
  if (report.dimensions?.length) {
    L.push(
      `## ${d.mdDimensionsHeading}`,
      "",
      `| ${d.mdDimensionCol} | ${d.mdScoreCol} |`,
      "|---|---|",
    );
    for (const dim of report.dimensions)
      L.push(`| ${dim.name} | ${dim.score} / ${dim.max} |`);
    if (report.score !== undefined)
      L.push(`| **${d.mdTotalRow}** | **${report.score} / 100** |`);
    L.push("");
  }
  pushPanelAndDebates(L, d, report.panel, report.key_debates);
  return L.join("\n");
}

function generateCompareMarkdown(c: Comparison, d: Dict): string {
  const L: string[] = [];
  L.push(`# ${d.mdCompareTitle}`);
  L.push(d.mdWinnerLine(c.winner));
  if (c.score_a !== undefined && c.score_b !== undefined)
    L.push(d.mdScoreLine(c.score_a, c.score_b));
  if (c.verdict) L.push("", "> " + c.verdict);
  if (c.contrast_points?.length) {
    L.push("", `## ${d.mdContrastHeading}`, "", d.mdContrastHeaderRow, "|---|---|---|---|");
    for (const p of c.contrast_points)
      L.push(
        `| ${p.aspect} | ${p.a_handling} | ${p.b_handling} | ${p.winner_on_aspect} |`,
      );
    L.push("");
  }
  pushPanelAndDebates(L, d, c.panel, c.key_debates);
  return L.join("\n");
}

function generateAdditionMarkdown(r: AdditionSingleResult, d: Dict): string {
  const L: string[] = [];
  L.push(`# ${d.mdAdditionTitle} · ${r.score ?? ""}`);
  if (r.score_label) L.push(`**${r.score_label}**`);
  if (r.verdict) L.push("", "> " + r.verdict);
  if (r.compatibility_note)
    L.push("", `## ${d.mdCompatibilityHeading}`, "", r.compatibility_note);
  if (r.subtractions?.length) {
    L.push("", `## ${d.mdSubtractionsHeading}`, "");
    for (const s of r.subtractions) L.push(`- **${s.element}**：${s.reason}`);
    L.push("");
  }
  pushPanelAndDebates(L, d, r.panel, r.key_debates);
  return L.join("\n");
}

function pushPanelAndDebates(
  L: string[],
  d: Dict,
  panel?: PanelMember[],
  debates?: KeyDebate[],
) {
  if (panel?.length) {
    L.push(`## ${d.mdPanelHeading}`, "");
    for (const p of panel) {
      L.push(`### ${p.name}（${p.role}）`);
      L.push(p.comment, "");
    }
  }
  if (debates?.length) {
    L.push(`## ${d.mdDebatesHeading}`, "");
    for (const deb of debates) {
      L.push(`### ⚡ ${deb.topic}`);
      L.push(`- ${deb.side_a.persona}：${deb.side_a.argument}`);
      L.push(`- ${deb.side_b.persona}：${deb.side_b.argument}`);
      L.push(`- **${d.chairmanVerdict}**：${deb.resolution}`, "");
    }
  }
}

function ExportBar({
  reportRef,
  markdown,
  fileName,
}: {
  reportRef: React.RefObject<HTMLDivElement | null>;
  markdown: string;
  fileName: string;
}) {
  const { d } = useI18n();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveAsPng = async () => {
    if (!reportRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: "#fbfbfd",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      const safeName = fileName.replace(/[\\/:*?"<>|]/g, "_");
      link.download = `${safeName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("export png failed", e);
    } finally {
      setSaving(false);
    }
  };

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={copyMd}
        className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
      >
        {copied ? d.copiedMd : d.copyMd}
      </button>
      <button
        type="button"
        onClick={saveAsPng}
        disabled={saving}
        className="rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black disabled:opacity-50"
      >
        {saving ? d.exporting : d.saveAsImage}
      </button>
    </div>
  );
}

function SingleReport({
  report,
  images = [],
}: {
  report: Report;
  images?: ReportImage[];
}) {
  const { d } = useI18n();
  const isNewFormat = report.summary !== undefined || !!report.dimensions;
  const reportRef = useRef<HTMLDivElement | null>(null);

  if (!isNewFormat) {
    return <OldSingleReport report={report} />;
  }
  return (
    <div>
      <ExportBar
        reportRef={reportRef}
        markdown={generateMarkdown(report, d)}
        fileName={`${report.subject_guess ?? d.mdDefaultTitle}-${d.mdSingleSuffix}-${report.score ?? ""}`}
      />
      <article
        ref={reportRef}
        className="space-y-10 rounded-2xl bg-[#fbfbfd] p-8 md:p-10"
      >
        <ReportTitle
          subjectGuess={report.subject_guess}
          score={report.score}
          scoreLabel={report.score_label}
        />

        <ImageStrip images={images} />

        {report.summary && <SummarySection summary={report.summary} />}

        {report.highlights && report.highlights.length > 0 && (
          <HighlightsSection items={report.highlights} />
        )}

        {report.improvements && report.improvements.length > 0 && (
          <ImprovementsSection items={report.improvements} />
        )}

        {report.dimensions && report.dimensions.length > 0 && (
          <DimensionsTable
            dimensions={report.dimensions}
            total={report.score}
          />
        )}

        {report.panel && report.panel.length > 0 && (
          <PanelCards panel={report.panel} />
        )}

        {report.key_debates && report.key_debates.length > 0 && (
          <KeyDebates debates={report.key_debates} />
        )}
      </article>
    </div>
  );
}

// 旧格式 fallback（兼容历史记录）
function OldSingleReport({ report }: { report: Report }) {
  const { d } = useI18n();
  return (
    <article className="space-y-14">
      {report.score !== undefined && (
        <section>
          <SectionLabel>{d.scoreSectionTitle}</SectionLabel>
          <div className="mt-1">
            <ScoreBadge score={report.score} label={report.score_label} />
          </div>
        </section>
      )}
      {report.verdict && (
        <section>
          <SectionLabel>{d.chairmanVerdict}</SectionLabel>
          <p className="display-verdict">{report.verdict}</p>
        </section>
      )}
      {report.panel && <PanelCards panel={report.panel} />}
      {report.key_debates && <KeyDebates debates={report.key_debates} />}
      {report.subtractions && report.subtractions.length > 0 && (
        <section>
          <SectionLabel>{d.subtractionsTitle}</SectionLabel>
          <ul className="space-y-5">
            {report.subtractions.map((s, i) => (
              <SubtractionItem key={i} s={s} />
            ))}
          </ul>
        </section>
      )}
      {report.rams_violations && report.rams_violations.length > 0 && (
        <section>
          <SectionLabel>{d.ramsViolationsTitle}</SectionLabel>
          <ul className="space-y-3">
            {report.rams_violations.map((v) => (
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
    </article>
  );
}

function AdditionSingleReport({
  report,
  images = [],
}: {
  report: AdditionSingleResult;
  images?: ReportImage[];
}) {
  const { d } = useI18n();
  const reportRef = useRef<HTMLDivElement | null>(null);
  return (
    <div>
      <ExportBar
        reportRef={reportRef}
        markdown={generateAdditionMarkdown(report, d)}
        fileName={`${d.mdAdditionTitle}-${report.score ?? ""}`}
      />
      <article
        ref={reportRef}
        className="space-y-10 rounded-2xl bg-[#fbfbfd] p-8 md:p-10"
      >
        {report.score !== undefined && (
          <section>
            <SectionLabel>{d.scoreSectionTitle}</SectionLabel>
            <div className="mt-1">
              <ScoreBadge score={report.score} label={report.score_label} />
            </div>
          </section>
        )}

        <ImageStrip images={images} />

        <section>
          <SectionLabel>{d.chairmanVerdict}</SectionLabel>
          <p className="display-verdict">{report.verdict}</p>
        </section>

        <section>
          <SectionLabel>{d.compatibilityTitle}</SectionLabel>
          <p className="text-base leading-relaxed text-[#1d1d1f]">
            {report.compatibility_note}
          </p>
        </section>

        {report.panel && report.panel.length > 0 && (
          <PanelCards panel={report.panel} />
        )}

        {report.key_debates && report.key_debates.length > 0 && (
          <KeyDebates debates={report.key_debates} />
        )}

        {report.subtractions && report.subtractions.length > 0 && (
          <section>
            <SectionLabel>{d.subtractionsAdditionTitle}</SectionLabel>
            <ul className="space-y-5">
              {report.subtractions.map((s, i) => (
                <SubtractionItem key={i} s={s} />
              ))}
            </ul>
          </section>
        )}

        {report.rams_violations && report.rams_violations.length > 0 && (
          <section>
            <SectionLabel>{d.ramsViolationsTitle}</SectionLabel>
            <ul className="space-y-3">
              {report.rams_violations.map((v) => (
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
      </article>
    </div>
  );
}

function CompareReport({
  comparison,
  images = [],
}: {
  comparison: Comparison;
  images?: ReportImage[];
}) {
  const { d } = useI18n();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const showScores =
    comparison.score_a !== undefined && comparison.score_b !== undefined;
  return (
    <div>
      <ExportBar
        reportRef={reportRef}
        markdown={generateCompareMarkdown(comparison, d)}
        fileName={`${d.mdExportFileNameCompare}${comparison.winner}`}
      />
      <article
        ref={reportRef}
        className="space-y-10 rounded-2xl bg-[#fbfbfd] p-8 md:p-10"
      >
      <ImageStrip images={images} />
      {showScores && (
        <section>
          <SectionLabel>{d.scoreSectionTitle}</SectionLabel>
          <div className="mt-1 flex items-baseline gap-8">
            <div>
              <p className="mb-1 text-xs text-[#86868b]">{d.labelImageA}</p>
              <ScoreBadge score={comparison.score_a!} size="md" />
            </div>
            <span className="text-xl text-[#d2d2d7]">vs</span>
            <div>
              <p className="mb-1 text-xs text-[#86868b]">{d.labelImageB}</p>
              <ScoreBadge score={comparison.score_b!} size="md" />
            </div>
          </div>
        </section>
      )}
      <section>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-1.5 text-sm font-medium text-white">
          <span className="text-xs text-white/60">{d.winnerBadge}</span>
          <span>{d.imageOf(comparison.winner)}</span>
        </div>
        <p className="display-verdict">{comparison.verdict}</p>
      </section>

      {comparison.panel && comparison.panel.length > 0 && (
        <PanelCards panel={comparison.panel} />
      )}

      {comparison.key_debates && comparison.key_debates.length > 0 && (
        <KeyDebates debates={comparison.key_debates} />
      )}

      <section>
        <SectionLabel>{d.contrastTableTitle}</SectionLabel>
        <div className="overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5ea] bg-[#fafafa]">
                <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#86868b]">
                  {d.contrastColDimension}
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#86868b]">
                  {d.contrastColA}
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#86868b]">
                  {d.contrastColB}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5ea]">
              {comparison.contrast_points.map((p, i) => {
                const aWin = p.winner_on_aspect === "A";
                const bWin = p.winner_on_aspect === "B";
                return (
                  <tr key={i}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium tracking-tight text-[#1d1d1f]">
                        {p.aspect}
                      </p>
                    </td>
                    <td
                      className={`px-5 py-4 align-top leading-relaxed text-[#1d1d1f] ${aWin ? "bg-[#fff8e6]" : ""}`}
                    >
                      {aWin && (
                        <span className="mr-1.5 text-xs text-[#8a5a00]">●</span>
                      )}
                      {p.a_handling}
                    </td>
                    <td
                      className={`px-5 py-4 align-top leading-relaxed text-[#1d1d1f] ${bWin ? "bg-[#fff8e6]" : ""}`}
                    >
                      {bWin && (
                        <span className="mr-1.5 text-xs text-[#8a5a00]">●</span>
                      )}
                      {p.b_handling}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-[#e5e5ea] bg-[#fafafa] px-5 py-2.5 text-xs text-[#86868b]">
            <span className="text-[#8a5a00]">●</span> {d.contrastLegend}
          </p>
        </div>
      </section>

      {comparison.rams_principles_invoked &&
        comparison.rams_principles_invoked.length > 0 && (
        <section>
          <SectionLabel>{d.ramsInvokedTitle}</SectionLabel>
          <ul className="space-y-3">
            {comparison.rams_principles_invoked.map((p) => (
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
      </article>
    </div>
  );
}
