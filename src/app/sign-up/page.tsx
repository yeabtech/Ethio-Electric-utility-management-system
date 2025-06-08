//src/app/sign-up/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp, useSignIn } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
export default function SignUpPage() {
  const { isLoaded, signUp } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle Clerk sign-up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        username,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      setError(null);
    } catch (err: any) {
      console.error('Sign-up failed:', err.errors?.[0]?.message || err.message);
      setError(err.errors?.[0]?.message || 'Sign-up failed. Please try again.');
    }
  };

  // Handle verification and login automatically
  const { signOut } = useAuth(); // Get signOut function

const handleVerify = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isLoaded || !isSignInLoaded) return;

  try {
    const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

    if (completeSignUp.status !== 'complete') {
      setError('Verification failed. Please check the code.');
      return;
    }

    const userId = completeSignUp.createdUserId;
    if (!userId) {
      setError('Failed to retrieve Clerk User ID.');
      return;
    }

    // Save user to PostgreSQL
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        clerkUserId: userId,
        role: 'customer',
      }),
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register user.');
    }

    // Sign out any existing session before signing in
    await signOut(); 

    // Automatically log in the user
    const signInAttempt = await signIn.create({ identifier: email, password });
    
    if (signInAttempt.status === 'complete') {
      alert('SIGNUP , SUCCESSFUL');
      router.push('/');
    } else {
      setError('Login failed. Please try signing in manually.');
    }
  } catch (err: any) {
    console.error('Verification failed:', err.message);
    setError(err.message || 'Verification failed. Please try again.');
  }
};
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#174B5A] px-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] text-center border border-[#A0C1CB]">
        {/* Back Button */}
        <div className="flex justify-start mb-4">
          <Link 
            href="/" 
            className="flex items-center text-[#498CA5] hover:text-[#174B5A] transition-colors duration-200"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Logo & Title */}
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <img src="logo.png" alt="EEUMS Logo" className="h-12" />
          <h1 className="text-3xl font-extrabold text-black">Sign Up</h1>
        </div>
    
        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
    
        {/* Signup Form */}
        {!pendingVerification ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-black font-semibold">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                required
              />
            </div>
            <div>
              <label className="block text-black font-semibold">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                required
              />
            </div>
            <div>
              <label className="block text-black font-semibold">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                required
              />
            </div>
            <div>
              <label className="block text-black font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                required
              />
            </div>
            <div>
              <label className="block text-black font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#498CA5] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#174B5A] transition-all duration-200"
            >
              Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-black font-semibold">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-[#A0C1CB] rounded-lg bg-[#E3F3FB] text-black placeholder-[#498CA5] focus:ring-2 focus:ring-[#498CA5]"
                placeholder="Check your email for the code"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#498CA5] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#174B5A] transition-all duration-200"
            >
              Verify & Login
            </button>
          </form>
        )}
    
        {/* Footer Link */}
        <p className="text-black text-sm mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-[#498CA5] font-semibold hover:text-[#174B5A] transition-colors duration-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
