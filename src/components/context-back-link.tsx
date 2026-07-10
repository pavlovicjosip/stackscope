"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ContextBackLink() {
  const from = useSearchParams().get("from");
  const safeFrom = from?.startsWith("/learn/") && !from.startsWith("//") ? from : "/learn/";
  return <Link className="back-link" href={safeFrom}>← {safeFrom === "/learn/" ? "Explore systems" : "Return to lesson"}</Link>;
}
