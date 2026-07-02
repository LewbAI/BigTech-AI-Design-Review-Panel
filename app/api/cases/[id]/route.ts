import { NextRequest, NextResponse } from "next/server";
import { getCase } from "@/lib/cases";

export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getCase(id);
  if (!record) {
    return NextResponse.json({ error: "案例不存在" }, { status: 404 });
  }
  return NextResponse.json({ case: record });
}
