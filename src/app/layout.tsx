import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBA Draft Battle",
  description: "NBA Draft Battle - Open Packs, Build Your Squad, Rule The Board",
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
