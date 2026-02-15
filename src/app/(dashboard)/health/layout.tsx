import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Health",
  description: "Server monitoring, queue status, and performance metrics.",
};

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
