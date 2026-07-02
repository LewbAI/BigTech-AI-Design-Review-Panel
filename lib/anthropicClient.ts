// 直接用 fetch 调 Anthropic REST API，不走 @anthropic-ai/sdk 的传输层。
//
// 背景：实测发现官方 SDK 自带的请求头（x-stainless-* 等）会被部分网络环境的
// WAF/中间设备拦截（返回 403 "Your request was blocked"，来自 Cloudflare 边缘，
// 不是 Anthropic API 本身的拒绝），而用裸 fetch 发送完全相同的请求内容能正常
// 通过。这里绕开 SDK 的请求构造，直接发 HTTPS 请求，规避这个兼容性问题。

import { ProxyAgent, fetch as undiciFetch } from "undici";

export type ContentBlockParam =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

type MessageParams = {
  model: string;
  max_tokens: number;
  system?: Array<{
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  }>;
  messages: Array<{ role: "user"; content: ContentBlockParam[] }>;
};

export type AnthropicMessage = {
  content: Array<{ type: string; text?: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

export class AnthropicRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AnthropicRequestError";
    this.status = status;
  }
}

function getFetch(): typeof fetch {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return fetch;

  const dispatcher = new ProxyAgent(proxyUrl);
  return ((url: string | URL, init?: RequestInit) =>
    undiciFetch(url as Parameters<typeof undiciFetch>[0], {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher,
    })) as unknown as typeof fetch;
}

export async function createMessage(
  apiKey: string,
  params: MessageParams,
): Promise<AnthropicMessage> {
  const doFetch = getFetch();
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AnthropicRequestError(res.status, text || `HTTP ${res.status}`);
  }

  return (await res.json()) as AnthropicMessage;
}

// 401（key 无效/占位符）或 403（账号被拒绝 / 请求被中间层拦截）都归为"key 没配好"
// ——用统一错误码，前端渲染成同一套傻瓜式引导
export function isAuthError(e: unknown): boolean {
  return e instanceof AnthropicRequestError && (e.status === 401 || e.status === 403);
}
