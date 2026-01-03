"use client";

import { useEffect, useState } from "react";
import { Navbar } from "."; 

export function NavbarClientGate() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-16 sticky top-0" />;

  return <Navbar />;
}