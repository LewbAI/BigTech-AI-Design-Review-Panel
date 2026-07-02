"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "zh" | "en";

export type Dict = {
  // Header / nav
  brandName: string;
  historyLink: string;
  tabSingle: string;
  tabCompare: string;
  tabAddition: string;

  // Upload zones
  dropzoneSingle: string;
  dropzoneA: string;
  dropzoneB: string;
  dropzoneBaseline: string;
  dropzoneProposalA: string;
  dropzoneProposalB: string;
  labelImageA: string;
  labelImageB: string;
  labelBaseline: string;
  labelProposalA: string;
  labelProposalB: string;
  requiredTag: string;
  optionalTag: string;
  additionHintPart1: string;
  additionHintPart2: string;
  previewAlt: string;

  // PRD + context toolbar
  prdButtonLabel: string;
  prdCharSuffix: (n: number) => string;
  contextButtonLabel: string;
  contextButtonHint: string;
  contextFilledSuffix: (n: number) => string;
  contextPanelTitle: string;
  contextPanelDesc: string;
  personaLabel: string;
  personaHint: string;
  personaPlaceholder: string;
  goalLabel: string;
  goalHint: string;
  goalPlaceholder: string;
  concernLabel: string;
  concernHint: string;
  concernPlaceholder: string;

  // Submit
  submitLoading: string;
  submitCompare: string;
  submitCompareAB: string;
  submitReview: string;
  loadingStages: string[];

  // Errors
  errGeneric: string;
  errPrdParse: string;
  errUploadRequired: string;
  err403Title: string;
  err403Steps: string[];

  // Image strip labels
  imgLabelDesign: string;
  imgLabelBaseline: string;
  imgLabelNewModule: string;

  // Feedback section
  feedbackTitle: string;
  feedbackAgree: string;
  feedbackPartial: string;
  feedbackDisagree: string;
  feedbackNotePlaceholder: string;
  feedbackMarkReference: string;
  feedbackMarkReferenceHint: string;
  feedbackSaving: string;
  feedbackSaved: string;
  feedbackSaveBtn: string;
  feedbackSavedNote: string;

  // PRD Modal
  prdModalTitle: string;
  prdModalDesc: string;
  closeAria: string;
  prdExtracting: string;
  prdChooseFile: string;
  prdOrPaste: string;
  prdTextareaPlaceholder: string;
  prdCharCount: (n: number) => string;
  prdClear: string;
  prdDone: string;

  // Score labels
  scoreLabelFn: (score: number) => string;
  outOf100: string;
  unnamedDesign: string;

  // Panel / debates
  panelHeading: (n: number) => string;
  debatesHeading: (n: number) => string;
  debateCollapse: string;
  debateExpand: string;
  chairmanVerdict: string;

  // Votes
  voteAgreeTitle: string;
  voteDisagreeTitle: string;
  voteUnanimous: string;
  voteCount: (n: number) => string;
  voteDissentPrefix: string;

  // Report sections
  highlightsTitle: string;
  improvementsTitle: string;
  dimensionsTitle: string;
  totalScore: string;
  reviewedImagesTitle: string;
  scoreSectionTitle: string;
  subtractionsTitle: string;
  subtractionsAdditionTitle: string;
  ramsViolationsTitle: string;
  principleLine: (n: number, name: string) => string;
  compatibilityTitle: string;
  winnerBadge: string;
  imageOf: (x: string) => string;
  contrastTableTitle: string;
  contrastColDimension: string;
  contrastColA: string;
  contrastColB: string;
  contrastLegend: string;
  ramsInvokedTitle: string;

  // Export bar
  copyMd: string;
  copiedMd: string;
  exporting: string;
  saveAsImage: string;

  // Markdown export
  mdDefaultTitle: string;
  mdSingleSuffix: string;
  mdCompareTitle: string;
  mdWinnerLine: (x: string) => string;
  mdScoreLine: (a: number, b: number) => string;
  mdHighlightsHeading: string;
  mdImprovementsHeading: string;
  mdDimensionsHeading: string;
  mdDimensionCol: string;
  mdScoreCol: string;
  mdTotalRow: string;
  mdContrastHeading: string;
  mdContrastHeaderRow: string;
  mdAdditionTitle: string;
  mdCompatibilityHeading: string;
  mdSubtractionsHeading: string;
  mdPanelHeading: string;
  mdDebatesHeading: string;
  mdExportFileNameCompare: string;
  mdExportFileNameAddition: string;

  // History pages
  historyTitle: string;
  backToReview: string;
  backToHistory: string;
  filterFeedbackLabel: string;
  filterAll: string;
  filterAgree: string;
  filterPartial: string;
  filterDisagree: string;
  filterUnrated: string;
  resultCount: (n: number) => string;
  loadingSuffix: string;
  emptyHistory: string;
  referenceMarked: string;
  noVerdictText: string;
  modeLabels: Record<
    "single" | "compare" | "addition_single" | "addition_ab",
    string
  >;
  caseDetailTitle: string;
  caseNotFound: string;
  caseNotFoundTitle: string;
  prdContextTitle: string;
  oneLineVerdictTitle: string;
  compareLabel: string;
};

const en_scoreLabelFn = (s: number): string => {
  if (s >= 96) return "On point";
  if (s >= 90) return "Mostly there";
  if (s >= 80) return "Usable";
  if (s >= 76) return "Needs polish";
  if (s > 70) return "Several issues";
  return "Clearly falls short";
};

const zh_scoreLabelFn = (s: number): string => {
  if (s >= 96) return "到位";
  if (s >= 90) return "基本到位";
  if (s >= 80) return "可用";
  if (s >= 76) return "需要打磨";
  if (s > 70) return "问题较多";
  return "严重不及格";
};

export const zh: Dict = {
  brandName: "大厂AI 设计评审团 · 开源skill",
  historyLink: "历史 →",
  tabSingle: "单稿审稿",
  tabCompare: "双稿对比",
  tabAddition: "新增模块审稿",

  dropzoneSingle: "拖入截图，或点击选择文件",
  dropzoneA: "拖入图 A",
  dropzoneB: "拖入图 B",
  dropzoneBaseline: "拖入原页面",
  dropzoneProposalA: "拖入方案 A",
  dropzoneProposalB: "+ 增加方案 B",
  labelImageA: "图 A",
  labelImageB: "图 B",
  labelBaseline: "原页面",
  labelProposalA: "方案 A",
  labelProposalB: "方案 B",
  requiredTag: "必传",
  optionalTag: "可选",
  additionHintPart1: '只传"原页面 + 方案 A" → 单方案审稿',
  additionHintPart2: '再加"方案 B" → A / B 对比',
  previewAlt: "预览",

  prdButtonLabel: "PRD",
  prdCharSuffix: (n) => `· ${n} 字`,
  contextButtonLabel: "告诉评委更多",
  contextButtonHint: "用户·目标·担心点",
  contextFilledSuffix: (n) => `· ${n}/3`,
  contextPanelTitle: "告诉评委更多",
  contextPanelDesc:
    "可选——但你填得越细，5 位评委的辩论越准、分数也越扎实。每填一项 + 2~3 分。",
  personaLabel: "用户 Persona",
  personaHint: "界面是给谁用的？（1-2 句）",
  personaPlaceholder: "例：25-35 岁的年轻用户，日常刷手机，对视觉品质敏感",
  goalLabel: "用户来这屏的目标",
  goalHint: "她想完成什么？（一句话）",
  goalPlaceholder: "例：完成注册、找到想看的内容、完成一次下单",
  concernLabel: "你最担心的点",
  concernHint: "想让评委重点辩论的话题",
  concernPlaceholder: "例：主按钮够不够明显、字号是不是太小",

  submitLoading: "审稿中…",
  submitCompare: "开始对比",
  submitCompareAB: "开始对比 A / B",
  submitReview: "开始审稿",
  loadingStages: [
    "正在读取设计稿…",
    "对照 Rams 十大原则…",
    "进行心理删除测试…",
    "整理减法建议…",
    "生成报告…",
  ],

  errGeneric: "请求失败",
  errPrdParse: "PRD 解析失败",
  errUploadRequired: "请上传一张截图",
  err403Title: "还没配置好 Anthropic API Key",
  err403Steps: [
    "打开 console.anthropic.com，注册或登录账号",
    "左侧菜单进入「API Keys」→ 点「Create Key」→ 复制生成的一串字符（以 sk-ant- 开头）",
    "打开项目文件夹里的 .env.local 文件（没有的话，把 .env.local.example 复制一份改名为 .env.local），把里面 ANTHROPIC_API_KEY= 后面换成你刚才复制的 key",
    "保存文件，关掉当前运行的服务，重新双击 start.command（或重新运行 npm run dev）",
  ],

  imgLabelDesign: "设计稿",
  imgLabelBaseline: "原页面",
  imgLabelNewModule: "新增方案",

  feedbackTitle: "你的反馈",
  feedbackAgree: "✓ 认同",
  feedbackPartial: "◐ 部分",
  feedbackDisagree: "✗ 不认同",
  feedbackNotePlaceholder:
    "想补充什么吗（可选）—— 比如这个判断哪里说到点、哪里偏了",
  feedbackMarkReference: "加入参考样本",
  feedbackMarkReferenceHint: "（往后审稿时 AI 会参考这条——v3.1 起生效）",
  feedbackSaving: "保存中…",
  feedbackSaved: "已保存",
  feedbackSaveBtn: "保存反馈",
  feedbackSavedNote: "✓ 已记录到历史",

  prdModalTitle: "PRD",
  prdModalDesc: "可选 · 作为视觉判断的语境（不审 PRD 落地，只让视觉判断更懂场景）",
  closeAria: "关闭",
  prdExtracting: "解析中…",
  prdChooseFile: "选文件 (.docx / .pdf / .md / .txt)",
  prdOrPaste: "或粘贴文字到下方",
  prdTextareaPlaceholder:
    "把 PRD 文字粘贴到这里，或点上方按钮上传 .docx / .pdf 自动提取",
  prdCharCount: (n) => `${n} 字`,
  prdClear: "清空",
  prdDone: "完成",

  scoreLabelFn: zh_scoreLabelFn,
  outOf100: "/ 100",
  unnamedDesign: "未命名设计稿",

  panelHeading: (n) => `评审席 · ${n} 位`,
  debatesHeading: (n) => `关键分歧 · ${n} 处`,
  debateCollapse: "收起",
  debateExpand: "展开看辩论",
  chairmanVerdict: "主席裁决",

  voteAgreeTitle: "同意删",
  voteDisagreeTitle: "反对删",
  voteUnanimous: "全员同意删",
  voteCount: (n) => `${n}/5 同意删`,
  voteDissentPrefix: "反对：",

  highlightsTitle: "好在哪里",
  improvementsTitle: "需要提升的地方",
  dimensionsTitle: "维度评分",
  totalScore: "总分",
  reviewedImagesTitle: "被审设计稿",
  scoreSectionTitle: "评分",
  subtractionsTitle: "建议删的元素",
  subtractionsAdditionTitle: "建议删的元素（仅针对新模块）",
  ramsViolationsTitle: "违反的 Rams 原则",
  principleLine: (n, name) => `原则 ${n}（${name}）`,
  compatibilityTitle: "与原页面的兼容性",
  winnerBadge: "胜出",
  imageOf: (x) => `图 ${x}`,
  contrastTableTitle: "逐维度对比",
  contrastColDimension: "维度",
  contrastColA: "图 A",
  contrastColB: "图 B",
  contrastLegend: "标注 = 该维度的胜出方",
  ramsInvokedTitle: "关键的 Rams 原则差异",

  copyMd: "复制 Markdown",
  copiedMd: "✓ 已复制 Markdown",
  exporting: "导出中…",
  saveAsImage: "保存为图片",

  mdDefaultTitle: "设计稿",
  mdSingleSuffix: "设计评审团",
  mdCompareTitle: "双稿对比 · 设计评审团",
  mdWinnerLine: (x) => `**胜出：图 ${x}**`,
  mdScoreLine: (a, b) => `图 A：${a} 分 ｜ 图 B：${b} 分`,
  mdHighlightsHeading: "好在哪里",
  mdImprovementsHeading: "需要提升的地方",
  mdDimensionsHeading: "维度评分",
  mdDimensionCol: "维度",
  mdScoreCol: "得分",
  mdTotalRow: "总分",
  mdContrastHeading: "逐维度对比",
  mdContrastHeaderRow: "| 维度 | 图 A | 图 B | 胜 |",
  mdAdditionTitle: "新增模块审稿",
  mdCompatibilityHeading: "与原页面的兼容性",
  mdSubtractionsHeading: "建议删的元素（仅针对新模块）",
  mdPanelHeading: "评审席",
  mdDebatesHeading: "关键分歧",
  mdExportFileNameCompare: "双稿对比-胜出图",
  mdExportFileNameAddition: "新增模块审稿",

  historyTitle: "历史",
  backToReview: "← 返回审稿",
  backToHistory: "← 返回历史",
  filterFeedbackLabel: "反馈",
  filterAll: "全部",
  filterAgree: "认同",
  filterPartial: "部分",
  filterDisagree: "不认同",
  filterUnrated: "未反馈",
  resultCount: (n) => `共 ${n} 条`,
  loadingSuffix: "（加载中…）",
  emptyHistory: "还没有审稿记录——回首页审一张试试。",
  referenceMarked: "★ 参考样本",
  noVerdictText: "（无判断文本）",
  modeLabels: {
    single: "单稿审稿",
    compare: "双稿对比",
    addition_single: "新增模块",
    addition_ab: "新增 A/B",
  },
  caseDetailTitle: "案例详情",
  caseNotFound: "案例不存在",
  caseNotFoundTitle: "案例",
  prdContextTitle: "PRD 语境",
  oneLineVerdictTitle: "一句话判断",
  compareLabel: "对比稿件",
};

export const en: Dict = {
  brandName: "Big Tech AI Design Review Panel · Open Source Skill",
  historyLink: "History →",
  tabSingle: "Single Review",
  tabCompare: "A/B Compare",
  tabAddition: "New Module Review",

  dropzoneSingle: "Drop a screenshot, or click to choose a file",
  dropzoneA: "Drop image A",
  dropzoneB: "Drop image B",
  dropzoneBaseline: "Drop the current page",
  dropzoneProposalA: "Drop proposal A",
  dropzoneProposalB: "+ Add proposal B",
  labelImageA: "Image A",
  labelImageB: "Image B",
  labelBaseline: "Current page",
  labelProposalA: "Proposal A",
  labelProposalB: "Proposal B",
  requiredTag: "Required",
  optionalTag: "Optional",
  additionHintPart1: 'Just "current page + proposal A" → single review',
  additionHintPart2: 'Add "proposal B" too → A/B comparison',
  previewAlt: "Preview",

  prdButtonLabel: "PRD",
  prdCharSuffix: (n) => `· ${n} chars`,
  contextButtonLabel: "Tell the judges more",
  contextButtonHint: "user · goal · concern",
  contextFilledSuffix: (n) => `· ${n}/3`,
  contextPanelTitle: "Tell the judges more",
  contextPanelDesc:
    "Optional — but the more detail you give, the sharper the debate and the more solid the score. Each field adds +2~3 points.",
  personaLabel: "User persona",
  personaHint: "Who is this screen for? (1-2 sentences)",
  personaPlaceholder:
    "e.g. Young users aged 25-35, browsing daily, sensitive to visual quality",
  goalLabel: "What the user came here to do",
  goalHint: "What are they trying to accomplish? (one sentence)",
  goalPlaceholder: "e.g. Finish signing up, find content, complete a purchase",
  concernLabel: "What worries you most",
  concernHint: "A topic you want the judges to debate",
  concernPlaceholder:
    "e.g. Is the main button prominent enough, is the font too small",

  submitLoading: "Reviewing…",
  submitCompare: "Start comparison",
  submitCompareAB: "Compare A / B",
  submitReview: "Start review",
  loadingStages: [
    "Reading the design…",
    "Checking against Rams' Ten Principles…",
    "Running the mental deletion test…",
    "Drafting subtraction suggestions…",
    "Generating the report…",
  ],

  errGeneric: "Request failed",
  errPrdParse: "Failed to parse the PRD",
  errUploadRequired: "Please upload a screenshot",
  err403Title: "No Anthropic API Key set up yet",
  err403Steps: [
    "Go to console.anthropic.com and sign up or log in",
    'In the left sidebar, go to "API Keys" → click "Create Key" → copy the string it generates (starts with sk-ant-)',
    "Open the .env.local file in the project folder (if it doesn't exist, copy .env.local.example and rename it to .env.local), then replace what's after ANTHROPIC_API_KEY= with the key you just copied",
    "Save the file, stop the currently running server, then double-click start.command again (or re-run npm run dev)",
  ],

  imgLabelDesign: "Design",
  imgLabelBaseline: "Current page",
  imgLabelNewModule: "New module",

  feedbackTitle: "Your feedback",
  feedbackAgree: "✓ Agree",
  feedbackPartial: "◐ Partially",
  feedbackDisagree: "✗ Disagree",
  feedbackNotePlaceholder:
    "Anything to add (optional) — e.g. where this nailed it, where it missed",
  feedbackMarkReference: "Mark as reference sample",
  feedbackMarkReferenceHint:
    "(future reviews will reference this — effective since v3.1)",
  feedbackSaving: "Saving…",
  feedbackSaved: "Saved",
  feedbackSaveBtn: "Save feedback",
  feedbackSavedNote: "✓ Recorded to history",

  prdModalTitle: "PRD",
  prdModalDesc:
    "Optional · used as context for the visual judgment (not reviewed for completeness — it only helps the review understand the scenario)",
  closeAria: "Close",
  prdExtracting: "Parsing…",
  prdChooseFile: "Choose file (.docx / .pdf / .md / .txt)",
  prdOrPaste: "or paste text below",
  prdTextareaPlaceholder:
    "Paste your PRD text here, or click the button above to auto-extract from .docx / .pdf",
  prdCharCount: (n) => `${n} chars`,
  prdClear: "Clear",
  prdDone: "Done",

  scoreLabelFn: en_scoreLabelFn,
  outOf100: "/ 100",
  unnamedDesign: "Untitled design",

  panelHeading: (n) => `Panel · ${n} judges`,
  debatesHeading: (n) => `Key debates · ${n}`,
  debateCollapse: "Collapse",
  debateExpand: "Expand to see the debate",
  chairmanVerdict: "Chair's ruling",

  voteAgreeTitle: "voted to cut",
  voteDisagreeTitle: "voted to keep",
  voteUnanimous: "Unanimous — cut it",
  voteCount: (n) => `${n}/5 voted to cut`,
  voteDissentPrefix: "Disagrees: ",

  highlightsTitle: "What works",
  improvementsTitle: "What needs work",
  dimensionsTitle: "Score breakdown",
  totalScore: "Total",
  reviewedImagesTitle: "Reviewed design",
  scoreSectionTitle: "Score",
  subtractionsTitle: "Elements to cut",
  subtractionsAdditionTitle: "Elements to cut (new module only)",
  ramsViolationsTitle: "Rams principles violated",
  principleLine: (n, name) => `Principle ${n} (${name})`,
  compatibilityTitle: "Compatibility with the current page",
  winnerBadge: "Winner",
  imageOf: (x) => `Image ${x}`,
  contrastTableTitle: "Side-by-side comparison",
  contrastColDimension: "Dimension",
  contrastColA: "Image A",
  contrastColB: "Image B",
  contrastLegend: "● marks the winner on that dimension",
  ramsInvokedTitle: "Key Rams principle differences",

  copyMd: "Copy Markdown",
  copiedMd: "✓ Copied",
  exporting: "Exporting…",
  saveAsImage: "Save as image",

  mdDefaultTitle: "Design",
  mdSingleSuffix: "Design Critique Panel",
  mdCompareTitle: "A/B Comparison · Design Critique Panel",
  mdWinnerLine: (x) => `**Winner: Image ${x}**`,
  mdScoreLine: (a, b) => `Image A: ${a} pts | Image B: ${b} pts`,
  mdHighlightsHeading: "What works",
  mdImprovementsHeading: "What needs work",
  mdDimensionsHeading: "Score breakdown",
  mdDimensionCol: "Dimension",
  mdScoreCol: "Score",
  mdTotalRow: "Total",
  mdContrastHeading: "Side-by-side comparison",
  mdContrastHeaderRow: "| Dimension | Image A | Image B | Winner |",
  mdAdditionTitle: "New Module Review",
  mdCompatibilityHeading: "Compatibility with the current page",
  mdSubtractionsHeading: "Elements to cut (new module only)",
  mdPanelHeading: "Panel",
  mdDebatesHeading: "Key debates",
  mdExportFileNameCompare: "ab-comparison-winner-image",
  mdExportFileNameAddition: "new-module-review",

  historyTitle: "History",
  backToReview: "← Back to review",
  backToHistory: "← Back to history",
  filterFeedbackLabel: "Feedback",
  filterAll: "All",
  filterAgree: "Agree",
  filterPartial: "Partial",
  filterDisagree: "Disagree",
  filterUnrated: "Unrated",
  resultCount: (n) => `${n} total`,
  loadingSuffix: " (loading…)",
  emptyHistory: "No reviews yet — go review one from the home page.",
  referenceMarked: "★ Reference sample",
  noVerdictText: "(no verdict text)",
  modeLabels: {
    single: "Single review",
    compare: "A/B compare",
    addition_single: "New module",
    addition_ab: "New module A/B",
  },
  caseDetailTitle: "Case detail",
  caseNotFound: "Case not found",
  caseNotFoundTitle: "Case",
  prdContextTitle: "PRD context",
  oneLineVerdictTitle: "One-line verdict",
  compareLabel: "Compared designs",
};

const DICTS: Record<Locale, Dict> = { zh, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  d: Dict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "design-critique-panel:locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") setLocaleState(stored);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "zh" ? "en" : "zh"),
      d: DICTS[locale],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
