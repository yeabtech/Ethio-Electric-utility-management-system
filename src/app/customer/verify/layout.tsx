// src/app/customer/verify/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { KYCProvider } from '@/context/kyc-context';

export default async function KYCLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  return (
    <KYCProvider userId={userId}>
      <div className="max-w-4xl mx-auto p-4">
        {children}
      </div>
    </KYCProvider>
  );
}
