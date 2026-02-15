import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Details",
  description: "View and manage user profile and associated projects.",
};

export default function UserDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
