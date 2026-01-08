"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GAListener() {
  const pathname = usePathname();

  useEffect(() => {
    window.gtag?.("config", "G-99NCXMEG24", {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}
