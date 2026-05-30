import { useEffect, useState } from "react";

// True below the lg breakpoint (the console switches to a mobile bottom-nav shell).
export function useIsMobile(query = "(max-width: 1023px)") {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
