import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding Steps",
  description: "Manage the project owner onboarding checklist steps.",
};

export default function OnboardingStepsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
