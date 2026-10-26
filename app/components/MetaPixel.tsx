"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { metaPixelId, trackMetaPageView } from "@/lib/meta-pixel";

/** Sends PageView on client navigations. The first view is fired by the base pixel in the layout. */
export default function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!metaPixelId()) return;
    if (first.current) {
      first.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname]);

  return null;
}
