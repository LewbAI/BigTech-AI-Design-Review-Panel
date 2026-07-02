import "./globals.css";
import type { Metadata } from "next";
import { LocaleProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "大厂AI 设计评审团 · 开源skill",
  description:
    "5 位设计与商业大师 AI 评审团，上传设计稿当场评审、吵架、博弈出结论 · 5 design & business legends debate your design live",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-neutral-900 antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
