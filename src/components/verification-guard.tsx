// src/components/verification-guard.tsx
'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function VerificationGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const checkVerification = async () => {
      if (user?.publicMetadata.role === 'customer' && !user?.publicMetadata.isVerified) {
        const response = await fetch(`/api/users/${user.id}/verification-status`);
        const { isVerified } = await response.json();
        
        if (!isVerified) {
          router.push('/customer/verify');
        }
      }
    };

    checkVerification();
  }, [user, router]);

  return <>{children}</>;
}