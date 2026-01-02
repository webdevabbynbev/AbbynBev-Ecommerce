"use client";

import { useEffect, useRef, useState } from "react";

export function RenderWhenVisible({
  children,
  rootMargin = "200px", //
  placeholder = null,
  className = "",
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || isVisible) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}