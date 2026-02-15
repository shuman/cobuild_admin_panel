import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Details",
  description: "View project details, members, and activity.",
};

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
