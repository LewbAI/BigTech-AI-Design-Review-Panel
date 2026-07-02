// PRD 文档解析：把 .docx / .pdf / .md / .txt 抽成纯文本

export type PrdExtractResult = {
  text: string;
  charCount: number;
  source: "docx" | "pdf" | "md" | "txt";
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : "";
}

export async function extractPrdFromFile(
  file: File,
): Promise<PrdExtractResult> {
  const ext = getExtension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "md" || ext === "txt") {
    const text = buffer.toString("utf8");
    return { text, charCount: text.length, source: ext };
  }

  if (ext === "docx") {
    // mammoth: convert .docx to plain text
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return { text, charCount: text.length, source: "docx" };
  }

  if (ext === "pdf") {
    // pdf-parse 静态 import 在 Next bundler 下会触发"读测试 PDF"的 bug，必须 dynamic import
    // @ts-expect-error pdf-parse 没有官方类型
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    const text: string = result.text || "";
    return { text, charCount: text.length, source: "pdf" };
  }

  throw new Error(`不支持的文件格式：.${ext}（仅支持 .docx / .pdf / .md / .txt）`);
}
