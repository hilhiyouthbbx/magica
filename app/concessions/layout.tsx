import type { Metadata } from "next";
export const metadata: Metadata = { title: "Concession Sign-Up | Hilhi Youth Basketball", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
