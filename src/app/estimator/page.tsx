import { Suspense } from "react";
import EstimatorPageClient from "./EstimatorPageClient";

export default function EstimatorPage() {
  return (
    <Suspense>
      <EstimatorPageClient />
    </Suspense>
  );
}