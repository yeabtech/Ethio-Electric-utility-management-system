import { Suspense } from "react";
import CustomerOperatorPageClient from "./CustomerOperatorPageClient";

export default function CustomerOperatorPage() {
  return (
    <Suspense>
      <CustomerOperatorPageClient />
    </Suspense>
  );
}