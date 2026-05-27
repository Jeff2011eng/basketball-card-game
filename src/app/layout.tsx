import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBA 最佳阵容对战",
  description: "NBA 最佳阵容对战 - 开包抽卡 · 组建阵容 · 统治赛场",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        {children}
      </body>
    </html>
  );
}
