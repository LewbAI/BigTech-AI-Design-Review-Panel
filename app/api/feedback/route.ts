import { NextRequest, NextResponse } from "next/server";
import { updateFeedback, type Feedback } from "@/lib/cases";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        case_id?: string;
        feedback?: Feedback;
        feedback_note?: string | null;
        reference_marked?: boolean;
      }
    | null;

  if (!body || !body.case_id) {
    return NextResponse.json({ error: "缺少 case_id" }, { status: 400 });
  }

  const validFeedback: Feedback[] = ["agree", "partial", "disagree", null];
  if (body.feedback !== undefined && !validFeedback.includes(body.feedback)) {
    return NextResponse.json({ error: "feedback 取值非法" }, { status: 400 });
  }

  const updated = await updateFeedback(body.case_id, {
    feedback: body.feedback,
    feedback_note: body.feedback_note,
    reference_marked: body.reference_marked,
  });

  if (!updated) {
    return NextResponse.json({ error: "案例不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, case: updated });
}
