import type { Metadata } from "next";
import DashboardShell from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CoBuild SuperAdmin dashboard — overview and quick access.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
