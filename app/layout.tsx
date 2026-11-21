import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BUSINESS } from "@/lib/config";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: `${BUSINESS.name} · Policy Desk`, template: `%s · ${BUSINESS.name}` },
  description: "Private policy, renewal and statement tracker.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Policy Desk", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f4ef",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
