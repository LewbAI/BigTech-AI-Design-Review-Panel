import { NextRequest, NextResponse } from "next/server";
import { createMessage, isAuthError } from "@/lib/anthropicClient";
import { buildSystemPrompt, buildUserPrompt, type Locale } from "@/lib/prompt";
import { detectMediaType } from "@/lib/imageType";
import { createCase, saveImageBytes } from "@/lib/cases";
import { extractJson } from "@/lib/extractJson";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const prdText = (formData.get("prdText") as string | null) || undefined;
  const persona = (formData.get("persona") as string | null) || undefined;
  const userGoal = (formData.get("userGoal") as string | null) || undefined;
  const userConcern =
    (formData.get("userConcern") as string | null) || undefined;
  const locale: Locale =
    (formData.get("locale") as string | null) === "en" ? "en" : "zh";

  if (!file) {
    return NextResponse.json({ error: "请上传一张截图" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "auth_403" }, { status: 403 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = detectMediaType(buffer);

  let message;
  try {
    message = await createMessage(apiKey, {
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(locale),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: buildUserPrompt({
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

  let report;
  try {
    report = JSON.parse(extractJson(textBlock.text));
  } catch {
    return NextResponse.json(
      { error: "JSON 解析失败", raw: textBlock.text },
      { status: 500 },
    );
  }

  // 持久化案例（图片 + 报告 + 元数据）
  const imageUrl = await saveImageBytes(buffer, mediaType, file.name);
  const record = await createCase({
    mode: "single",
    prd_text: prdText ?? null,
    persona: persona ?? null,
    user_goal: userGoal ?? null,
    user_concern: userConcern ?? null,
    image_urls: [imageUrl],
    report,
  });

  return NextResponse.json({
    case_id: record.id,
    report,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens:
        message.usage.cache_creation_input_tokens ?? 0,
    },
  });
}
