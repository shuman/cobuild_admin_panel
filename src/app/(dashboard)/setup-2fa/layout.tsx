import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Two-Factor Authentication",
  description: "Enable two-factor authentication for your SuperAdmin account.",
};

export default function Setup2FALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
