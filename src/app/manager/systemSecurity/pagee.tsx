"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SystemSecurityPage() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // Try to get role and verification from Clerk publicMetadata
      const publicRole = user.publicMetadata?.role as string | undefined;
      const publicIsVerified = user.publicMetadata?.isVerified as boolean | undefined;
      setRole(publicRole || null);
      setIsVerified(typeof publicIsVerified === "boolean" ? publicIsVerified : null);
      setLoading(false);
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4 text-[#174B5A]">System Security Overview</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Clerk Security Features</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>🔒 <b>Authentication Middleware:</b> All protected routes require Clerk authentication.</li>
          <li>🛡️ <b>Role-Based Access Control:</b> Users are assigned roles (manager, estimator, cso, technician, customer) and access is restricted accordingly.</li>
          <li>✅ <b>Verification Enforcement:</b> Customers must complete identity verification (KYC) before accessing services.</li>
          <li>🗝️ <b>Session Management:</b> Clerk manages secure user sessions and session claims.</li>
          <li>📋 <b>User Metadata:</b> Clerk stores verification status and other security info in user metadata.</li>
          <li>✉️ <b>Secure Registration & Sign-In:</b> All sign-up and sign-in flows use Clerk’s secure forms and email verification.</li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Clerk Security Status</h2>
        {loading ? (
          <div>Loading your security info...</div>
        ) : user ? (
          <div className="space-y-2">
            <div><b>Email:</b> {user.emailAddresses[0]?.emailAddress || "N/A"}</div>
            <div><b>Role:</b> {role || "Not set"}</div>
            <div><b>Verification Status:</b> {isVerified === true ? "Verified" : isVerified === false ? "Not Verified" : "Unknown"}</div>
            <div><b>Clerk User ID:</b> {user.id}</div>
          </div>
        ) : (
          <div className="text-red-600">You are not signed in.</div>
        )}
      </div>
      <div className="text-sm text-gray-500">
        For more information or to manage security settings, please contact your system administrator or visit the Clerk dashboard.
      </div>
    </div>
  );
}
