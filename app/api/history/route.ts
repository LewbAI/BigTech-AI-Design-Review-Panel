import { NextRequest, NextResponse } from "next/server";
import { listCases, type Feedback } from "@/lib/cases";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  const feedbackRaw = searchParams.get("feedback");

  let feedback: Feedback | undefined;
  if (feedbackRaw === "agree") feedback = "agree";
  else if (feedbackRaw === "partial") feedback = "partial";
  else if (feedbackRaw === "disagree") feedback = "disagree";
  else if (feedbackRaw === "null") feedback = null;

  const result = await listCases({ limit, offset, feedback });
  return NextResponse.json(result);
}
