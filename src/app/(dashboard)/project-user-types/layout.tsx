import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project User Types",
  description: "Manage project user types and their default permission settings.",
};

export default function ProjectUserTypesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
