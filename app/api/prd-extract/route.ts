import { NextRequest, NextResponse } from "next/server";
import { extractPrdFromFile } from "@/lib/prdExtract";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请上传 PRD 文件" }, { status: 400 });
  }

  try {
    const result = await extractPrdFromFile(file);
    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json(
        {
          error: "文件解析后内容为空，可能是扫描件或受密码保护，请改为粘贴文字",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "解析失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
