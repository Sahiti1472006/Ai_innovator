import type { Metadata } from "next";
import "./globals.css";
import { SideNav } from "@/components/ui/SideNav";

export const metadata: Metadata = {
  title: "SupportMind AI",
  description: "B2B Technical Support AI Agent with Hindsight persistent memory",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-surface text-gray-900 antialiased">
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1 ml-56 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
