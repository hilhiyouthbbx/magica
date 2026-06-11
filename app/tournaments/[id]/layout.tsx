import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tournament Details | Hilhi Youth Basketball" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
