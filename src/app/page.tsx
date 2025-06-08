//src/app/page.tsx

'use client'; // Mark this as a Client Component
import '../app/globals.css';
import Loading from './loading/load';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false); // Track if component has mounted

  useEffect(() => {
    setHasMounted(true); // Set mounted to true after initial render
  }, []);

  useEffect(() => {
    if (hasMounted && isLoaded && user) {
      const fetchRole = async () => {
        try {
          const response = await fetch('/api/get-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clerkUserId: user.id }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log('API Response:', data); // Debugging
          setRole(data.role);

          if (data.role) {
            console.log('Redirecting to:', data.role); // Debugging
            switch (data.role) {
              case 'manager':
                router.push('/manager');
                break;
              case 'estimator':
                router.push('/estimator');
                break;
              case 'cso':
                router.push('/cso');
                break;
              case 'technician':
                router.push('/technician');
                break;
              case 'customer':
                router.push('/customer');
                break;
              default:
                router.push('/');
            }
          }
        } catch (error) {
          console.error('Error fetching role:', error);
        }
      };

      fetchRole();
    }
  }, [user, isLoaded, router, hasMounted]);

  if (!hasMounted || !isLoaded) {
    return <div>
      <Loading/>
    </div>; // Show a loading state until the component mounts
  }

  return (
<div className="min-h-screen flex flex-col items-center justify-center px-4 relative" style={{ backgroundImage: 'url(/home.gif)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
  {/* Overlay */}
  <div className="absolute inset-0 bg-[#498CA5] opacity-90 z-0 backdrop-blur-sm"></div>
  <div className="w-full flex flex-col items-center justify-center min-h-screen relative z-10">
    <div className="max-w-2xl w-full flex flex-col items-center gap-8">
      {/* Logo and Header */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/30 border border-[#A0C1CB] px-10 py-6 flex flex-col sm:flex-row items-center gap-6 w-full">
          <Image src="/mainlogo.png" alt="EEUMS Logo" width={100} height={20} className="object-contain" />
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-md text-[#498CA5] font-semibold"> Ethiopia Electricity Power </span>
            <span className="text-md text-[#cd0100] font-semibold"> የኢትዮጵያ ኤሌክትሪክ ኃይል</span>
          </div>
        </div>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-[#164253] leading-tight mb-2 text-center">
        <span className="text-[#E3F3FB]">New</span> Generation of Services
      </h1>

      {/* Subheading */}
      <p className="text-lg sm:text-xl text-[#A0C1CB] mb-8 text-center">
        We Manage Your Services Efficiently With Our Powerful Tools.
      </p>

      {/* CTA Section */}
      <div className="flex flex-col items-center gap-6">
        {user ? (
          <div className="flex flex-col items-center gap-3 bg-white/80 rounded-lg px-6 py-4 shadow">
            <p className="text-lg text-[#498CA5]">Welcome, {user.firstName}!</p>
            <UserButton afterSignOutUrl="/" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/sign-up" className="bg-[#1b6b88] text-white px-8 py-3 rounded-lg shadow-md hover:bg-[#217a93] transition text-lg font-semibold w-full sm:w-auto text-center">
              Sign-up
            </Link>
            <Link href="/sign-in" className="bg-[#ffffff] text-[#174B5A] px-8 py-3 rounded-lg shadow-md hover:bg-[#638896] hover:text-white transition text-lg font-semibold w-full sm:w-auto text-center">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
</div>

  );
}