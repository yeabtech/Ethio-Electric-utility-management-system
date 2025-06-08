//src/app/sign-in/page.tsx

"use client";

import { SignIn } from "@clerk/nextjs";
import "@/app/globals.css";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#174B5A] px-3 sm:px-3">
      <div className="w-full max-w-[95%] sm:max-w-lg p-4 sm:p-10 space-y-4 flex flex-col items-center">
        <div className="text-center w-full mb-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#E3F3FB] mb-2 sm:mb-3">Welcome Back</h2>
          <p className="text-base sm:text-lg md:text-xl text-[#A0C1CB]">Please sign in to continue</p>
        </div>
        <div className="w-full flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-[#498CA5] hover:bg-[#174B5A]',
                footerActionLink: 'text-[#498CA5] hover:text-[#174B5A]'
              }
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
}
