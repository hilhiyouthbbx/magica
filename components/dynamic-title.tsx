"use client";
import { useEffect } from "react";

const BRAND = "Hilhi Youth Basketball";

type PageKey =
  | "home" | "events" | "campSchedule" | "tournaments"
  | "tryout" | "youthCoaches" | "hsCoaches" | "merch"
  | "filmRoom" | "register";

interface Props {
  pageKey: PageKey;
  fallback: string; // e.g. "Camp Schedule | Hilhi Youth Basketball"
}

export function DynamicTitle({ pageKey, fallback }: Props) {
  useEffect(() => {
    fetch("/api/content")
      .then(r => r.json())
      .then(d => {
        const custom = (d?.pageTitles?.[pageKey] as string | undefined)?.trim();
        document.title = custom ? `${custom} | ${BRAND}` : fallback;
      })
      .catch(() => {
        document.title = fallback;
      });
  }, [pageKey, fallback]);

  return null;
}
