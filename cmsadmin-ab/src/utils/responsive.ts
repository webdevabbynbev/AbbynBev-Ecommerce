import React from "react";

const getIsMobile = () => window.innerWidth <= 768;

export default function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile());

  React.useEffect(() => {
    const onResize = () => {
      setIsMobile(getIsMobile());
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return isMobile;
}
