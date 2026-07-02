// 案例存储：本地 JSON + 图片文件
// 数据安全：全本地，不上传任何地方
//
// 存储位置：
//   data/cases.json          案例元数据
//   public/uploads/<file>    原图（Next 自动 serve 为 /uploads/*）

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const CASES_FILE = path.join(DATA_DIR, "cases.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type Feedback = "agree" | "partial" | "disagree" | null;

export type CaseMode = "single" | "compare" | "addition_single" | "addition_ab";

export type CaseRecord = {
  id: string;
  mode: CaseMode;
  prd_text: string | null;
  // v4.0 新增上下文输入
  persona: string | null;
  user_goal: string | null;
  user_concern: string | null;
  image_urls: string[];
  report: unknown;
  feedback: Feedback;
  feedback_note: string | null;
  reference_marked: boolean;
  created_at: number;
  updated_at: number;
};

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readAll(): Promise<CaseRecord[]> {
  try {
    const buf = await fs.readFile(CASES_FILE, "utf8");
    return JSON.parse(buf) as CaseRecord[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(cases: CaseRecord[]): Promise<void> {
  await ensureDirs();
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf8");
}

function mediaTypeToExt(mt: string): string {
  if (mt === "image/jpeg") return ".jpg";
  if (mt === "image/gif") return ".gif";
  if (mt === "image/webp") return ".webp";
  return ".png";
}

// 用已有的 buffer 保存（route 内已经为了 base64 读过 buffer，这里复用）
export async function saveImageBytes(
  buffer: Buffer,
  mediaType: string,
  originalName?: string,
): Promise<string> {
  await ensureDirs();
  const fromName = originalName ? path.extname(originalName) : "";
  const ext = fromName || mediaTypeToExt(mediaType);
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}

export async function createCase(
  input: Omit<CaseRecord, "id" | "feedback" | "feedback_note" | "reference_marked" | "created_at" | "updated_at">,
): Promise<CaseRecord> {
  const now = Date.now();
  const record: CaseRecord = {
    ...input,
    id: randomUUID(),
    feedback: null,
    feedback_note: null,
    reference_marked: false,
    created_at: now,
    updated_at: now,
  };
  const cases = await readAll();
  cases.unshift(record); // 最新的在前
  await writeAll(cases);
  return record;
}

export async function listCases(opts?: {
  limit?: number;
  offset?: number;
  feedback?: Feedback;
}): Promise<{ items: CaseRecord[]; total: number }> {
  let cases = await readAll();

  if (opts?.feedback !== undefined) {
    cases = cases.filter((c) => c.feedback === opts.feedback);
  }

  const total = cases.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 50;
  const items = cases.slice(offset, offset + limit);
  return { items, total };
}

export async function getCase(id: string): Promise<CaseRecord | null> {
  const cases = await readAll();
  return cases.find((c) => c.id === id) ?? null;
}

export async function updateFeedback(
  id: string,
  patch: {
    feedback?: Feedback;
    feedback_note?: string | null;
    reference_marked?: boolean;
  },
): Promise<CaseRecord | null> {
  const cases = await readAll();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: CaseRecord = {
    ...cases[idx],
    ...patch,
    updated_at: Date.now(),
  };
  cases[idx] = updated;
  await writeAll(cases);
  return updated;
}
