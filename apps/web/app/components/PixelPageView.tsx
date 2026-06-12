"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pixel } from "../../lib/pixel";

/**
 * Fires a deduplicated PageView (client + CAPI, same event_id) on every route,
 * but only once per page per session — a refresh of the same page won't re-fire.
 */
export default function PixelPageView() {
  const pathname = usePathname();
  useEffect(() => {
    pixel.pageView(pathname);
  }, [pathname]);
  return null;
}
