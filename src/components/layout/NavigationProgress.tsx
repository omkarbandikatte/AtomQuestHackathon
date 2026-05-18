"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin progress bar at the top of the page that shows during navigation.
 * Uses pathname changes to detect navigation start/end.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsNavigating(false);
      setPrevPathname(pathname);
    }
  }, [pathname, prevPathname]);

  // Listen for click on navigation links to show progress immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.href.includes("#") &&
        anchor.target !== "_blank"
      ) {
        const url = new URL(anchor.href);
        if (url.pathname !== pathname) {
          setIsNavigating(true);
        }
      }
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div className="h-full bg-brand-teal animate-progress-bar" />
    </div>
  );
}
