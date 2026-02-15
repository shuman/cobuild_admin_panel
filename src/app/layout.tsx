import type { Metadata, Viewport } from "next";
import Providers from "@/components/providers/Providers";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "CoBuild SuperAdmin",
    template: "%s | CoBuild SuperAdmin",
  },
  description:
    "CoBuild Manager SuperAdmin Portal — manage users, projects, and platform operations.",
  applicationName: "CoBuild SuperAdmin",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
