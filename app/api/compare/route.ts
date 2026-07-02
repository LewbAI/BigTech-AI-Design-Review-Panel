import { NextRequest, NextResponse } from "next/server";
import { createMessage, isAuthError } from "@/lib/anthropicClient";
import {
  buildCompareSystemPrompt,
  buildCompareUserPrompt,
  type Locale,
} from "@/lib/prompt";
import { detectMediaType, type MediaType } from "@/lib/imageType";
import { createCase, saveImageBytes } from "@/lib/cases";
import { extractJson } from "@/lib/extractJson";

export const maxDuration = 60;

async function readFile(
  file: File,
): Promise<{ buffer: Buffer; base64: string; mediaType: MediaType; name: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    buffer,
    base64: buffer.toString("base64"),
    mediaType: detectMediaType(buffer),
    name: file.name,
  };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fileA = formData.get("imageA") as File | null;
  const fileB = formData.get("imageB") as File | null;
  const prdText = (formData.get("prdText") as string | null) || undefined;
  const persona = (formData.get("persona") as string | null) || undefined;
  const userGoal = (formData.get("userGoal") as string | null) || undefined;
  const userConcern =
    (formData.get("userConcern") as string | null) || undefined;
  const locale: Locale =
    (formData.get("locale") as string | null) === "en" ? "en" : "zh";

  if (!fileA || !fileB) {
    return NextResponse.json(
      { error: "请上传两张截图（图 A 和图 B）" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "auth_403" }, { status: 403 });
  }

  const a = await readFile(fileA);
  const b = await readFile(fileB);

  let message;
  try {
    message = await createMessage(apiKey, {
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: buildCompareSystemPrompt(locale),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "图 A：" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: a.mediaType,
                data: a.base64,
              },
            },
            { type: "text", text: "图 B：" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: b.mediaType,
                data: b.base64,
              },
            },
            {
              type: "text",
              text: buildCompareUserPrompt({
                prdText,
                persona,
                userGoal,
                userConcern,
                locale,
              }),
            },
          ],
        },
      ],
    });
  } catch (e) {
    if (isAuthError(e)) {
      return NextResponse.json({ error: "auth_403" }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : "调用模型失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const textBlock = message.content.find(
    (b): b is { type: "text"; text: string } => b.type === "text",
  );
  if (!textBlock) {
    return NextResponse.json({ error: "模型未返回文本" }, { status: 500 });
  }

  let comparison;
  try {
    comparison = JSON.parse(extractJson(textBlock.text));
  } catch {
    return NextResponse.json(
      { error: "JSON 解析失败", raw: textBlock.text },
      { status: 500 },
    );
  }

  // 持久化案例
  const [urlA, urlB] = await Promise.all([
    saveImageBytes(a.buffer, a.mediaType, a.name),
    saveImageBytes(b.buffer, b.mediaType, b.name),
  ]);
  const record = await createCase({
    mode: "compare",
    prd_text: prdText ?? null,
    persona: persona ?? null,
    user_goal: userGoal ?? null,
    user_concern: userConcern ?? null,
    image_urls: [urlA, urlB],
    report: comparison,
  });

  return NextResponse.json({
    case_id: record.id,
    comparison,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens:
        message.usage.cache_creation_input_tokens ?? 0,
    },
  });
}
