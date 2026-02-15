import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to the CoBuild SuperAdmin portal.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
