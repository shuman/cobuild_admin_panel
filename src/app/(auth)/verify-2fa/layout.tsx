import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify 2FA",
  description: "Enter your two-factor authentication code to sign in.",
};

export default function Verify2FALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
