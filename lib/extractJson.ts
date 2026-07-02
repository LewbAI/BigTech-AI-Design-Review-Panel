// 从模型输出里稳健地抽出 JSON
// 处理：markdown 围栏、前后多余文字、首尾噪声
// 不处理：被 max_tokens 截断的不完整 JSON（那是配额问题）

export function extractJson(text: string): string {
  let t = text.trim();

  // 去掉 markdown 代码围栏
  t = t
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  // 抽取第一个 { 到最后一个 } 之间的内容（去掉前后散文）
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) {
    t = t.slice(first, last + 1);
  }

  return t.trim();
}
