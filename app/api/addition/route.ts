import { NextRequest, NextResponse } from "next/server";
import {
  createMessage,
  isAuthError,
  type ContentBlockParam,
} from "@/lib/anthropicClient";
import {
  buildAdditionSingleSystemPrompt,
  buildAdditionABSystemPrompt,
  buildAdditionSingleUserPrompt,
  buildAdditionABUserPrompt,
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
  const baseline = formData.get("baseline") as File | null;
  const proposalA = formData.get("proposalA") as File | null;
  const proposalB = formData.get("proposalB") as File | null;
  const prdText = (formData.get("prdText") as string | null) || undefined;
  const persona = (formData.get("persona") as string | null) || undefined;
  const userGoal = (formData.get("userGoal") as string | null) || undefined;
  const userConcern =
    (formData.get("userConcern") as string | null) || undefined;
  const locale: Locale =
    (formData.get("locale") as string | null) === "en" ? "en" : "zh";

  if (!baseline) {
    return NextResponse.json(
      { error: "请上传原页面（baseline）" },
      { status: 400 },
    );
  }
  if (!proposalA) {
    return NextResponse.json(
      { error: "请上传方案 A（必传）" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "auth_403" }, { status: 403 });
  }

  const baselineImg = await readFile(baseline);
  const aImg = await readFile(proposalA);
  const bImg = proposalB ? await readFile(proposalB) : null;

  const isAB = bImg !== null;
  const systemPrompt = isAB
    ? buildAdditionABSystemPrompt(locale)
    : buildAdditionSingleSystemPrompt(locale);
  const ctxOpts = { prdText, persona, userGoal, userConcern, locale };
  const userText = isAB
    ? buildAdditionABUserPrompt(ctxOpts)
    : buildAdditionSingleUserPrompt(ctxOpts);

  const content: ContentBlockParam[] = [
    { type: "text", text: "原页面：" },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: baselineImg.mediaType,
        data: baselineImg.base64,
      },
    },
    { type: "text", text: isAB ? "方案 A：" : "新增模块方案：" },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: aImg.mediaType,
        data: aImg.base64,
      },
    },
  ];

  if (isAB && bImg) {
    content.push({ type: "text", text: "方案 B：" });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: bImg.mediaType,
        data: bImg.base64,
      },
    });
  }

  content.push({ type: "text", text: userText });

  let message;
  try {
    message = await createMessage(apiKey, {
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content }],
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

  let result;
  try {
    result = JSON.parse(extractJson(textBlock.text));
  } catch {
    return NextResponse.json(
      { error: "JSON 解析失败", raw: textBlock.text },
      { status: 500 },
    );
  }

  // 持久化案例
  const imageUrls: string[] = [];
  imageUrls.push(
    await saveImageBytes(baselineImg.buffer, baselineImg.mediaType, baselineImg.name),
  );
  imageUrls.push(
    await saveImageBytes(aImg.buffer, aImg.mediaType, aImg.name),
  );
  if (bImg) {
    imageUrls.push(
      await saveImageBytes(bImg.buffer, bImg.mediaType, bImg.name),
    );
  }
  const record = await createCase({
    mode: isAB ? "addition_ab" : "addition_single",
    prd_text: prdText ?? null,
    persona: persona ?? null,
    user_goal: userGoal ?? null,
    user_concern: userConcern ?? null,
    image_urls: imageUrls,
    report: result,
  });

  return NextResponse.json({
    case_id: record.id,
    mode: isAB ? "ab" : "single",
    result,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens:
        message.usage.cache_creation_input_tokens ?? 0,
    },
  });
}
