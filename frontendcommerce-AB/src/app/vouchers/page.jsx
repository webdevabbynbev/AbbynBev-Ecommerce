export const dynamic = "force-dynamic";
import { Suspense } from "react";
import VouchersClient from "./VouchersClient";

export function VouchersPage() {
  return (
    <Suspense
      fallback={<div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>}
    >
      <VouchersClient />
    </Suspense>
  );
}
