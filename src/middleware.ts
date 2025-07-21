// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public API or frontend routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-up",
  "/sign-in",
  "/sign-in/(.*)",
  "/sign-up/(.*)",
  "/api/get-role",
  "/api/register",
  "/api/manager-register",
  "/api/employee-info",
  "/api/upload",
  "/api/uploadthing",
  "/api/customer/verify",
  "/api/customer/services(.*)",
  "/api/customer/services/new-connection",
  "/api/customer/verification-status(.*)",
  "/api/cso/verifications(.*)",
  "/api/cso/services/(.*)",
  "/api/cso/services",
  "/api/cso/tasks/(.*)",
  "/api/cso/services/[id]/status",
  "/api/estimator/pricing",
  "/api/customer/receipts(.*)",
  "/api/customer/pending-receipts(.*)",
  "/api/technicians",
  "/api/technician/tasks/[id]/status",
  "/api/technician/tasks/(.*)",
  "/api/customer/services/repairs",
  "/api/manager/employee",
  "/api/manager/news",
  "/api/payment/initiate",
  "/api/payment/verify",
  "/api/payment/verify-return",
  "/api/customer/applications",
  "/api/customer/applications/(.*)",
  "/api/meter-pricing",
  "/api/cso/support",
  "/api/cso/support/(.*)",
  "/api/tawk/chat",
  "/api/tawk/chat/(.*)",
  "/api/estimator/statistics",
  "/api/estimator/statistics/(.*)",
  "/api/report/templates",
  "/api/get-clerk-user",
  "/api/customer-verficationS-all",
  // Clerk management APIs (security logs, user/session management)
  "/api/clerk/logs",
  "/api/clerk/update-role",
  "/api/clerk/revoke-session",

  
  
]);

// Special routes for verification
const isCustomerVerificationRoute = createRouteMatcher([
  "/customer/verify",
  "/customer/verify/:path*",
]);

// Estimator routes
const isEstimatorRoute = createRouteMatcher([
  "/estimator/:path*",
]);

// CSO verification routes
const isCsoVerificationRoute = createRouteMatcher([
  "/cso/verifications/:path*",
  "/cso/verifications",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  console.log(`🌐 Middleware triggered for: ${url.pathname}`);

  // 1. Allow public routes without authentication
  if (isPublicRoute(req)) {
    console.log("✅ Public route accessed, allowing:", url.pathname);
    return NextResponse.next();
  }

  // 2. Authenticate user
  const authObject = await auth();
  console.log("🔐 Auth object:", JSON.stringify(authObject, null, 2));

  if (!authObject.userId) {
    console.log("⛔ Unauthenticated user, redirecting to sign-in");
    const signInUrl = new URL('/sign-in', url.origin);
    signInUrl.searchParams.set('redirect_url', url.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 3. Extract session claims
  let sessionClaims = authObject.sessionClaims as {
    role?: string;
    isVerified?: boolean;
    metadata?: Record<string, any>;
  } | null;

  // 4. If no role, fetch from your API
  if (!sessionClaims?.role) {
    console.log("ℹ️ Role missing, fetching from /api/get-role...");
    try {
      const roleResponse = await fetch(new URL("/api/get-role", url.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: authObject.userId }),
      });

      if (roleResponse.ok) {
        const data = await roleResponse.json();
        sessionClaims = {
          ...sessionClaims,
          role: data.role,
          isVerified: data.isVerified,
          metadata: data.metadata,
        };
        console.log("✅ Role fetched successfully:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching user role:", error);
    }
  }

  const userRole = sessionClaims?.role;

  // 5. Customer-specific logic (verification flow)
  if (userRole === "customer") {
    if (isCustomerVerificationRoute(req)) {
      return NextResponse.next();
    }

    if (sessionClaims?.isVerified === false && !url.pathname.startsWith("/customer/verify")) {
      console.log("⛔ Unverified customer, redirecting to /customer/verify");
      return NextResponse.redirect(new URL("/customer/verify", url.origin));
    }

    if (sessionClaims?.isVerified === true && url.pathname.startsWith("/customer/verify")) {
      console.log("⛔ Verified customer trying to access verify page, redirecting to dashboard");
      return NextResponse.redirect(new URL("/customer/dashboard", url.origin));
    }
  }

  // 6. Estimator-specific access
  if (userRole === "estimator" && isEstimatorRoute(req)) {
    console.log("✅ Estimator accessing estimator routes:", url.pathname);
    return NextResponse.next();
  }

  // 7. CSO-specific verification access
  if (userRole === "cso" && isCsoVerificationRoute(req)) {
    console.log("✅ CSO accessing verification routes:", url.pathname);
    return NextResponse.next();
  }

    // 8. Technician-specific access
    if (userRole === "technician" && url.pathname.startsWith("/api/technician")) {
      console.log("✅ Technician accessing technician routes:", url.pathname);
      return NextResponse.next();
    }

  // 9. Role-based dashboard redirection
  const rolePaths: Record<string, string> = {
    manager: "/manager",
    estimator: "/estimator",
    technician: "/technician",
    cso: "/cso",
    customer: "/customer",
  };

  const expectedPath = userRole ? rolePaths[userRole] : null;

  if (expectedPath && url.pathname === "/") {
    console.log(`🔀 Redirecting ${userRole} to dashboard: ${expectedPath}`);
    return NextResponse.redirect(new URL(expectedPath, url.origin));
  }

  if (expectedPath && !url.pathname.startsWith(expectedPath) && !url.pathname.startsWith("/api")) {
    console.log(`⛔ ${userRole} trying to access ${url.pathname}, redirecting to their dashboard`);
    return NextResponse.redirect(new URL(expectedPath, url.origin));
  }
  

  console.log("✅ Access granted to:", url.pathname);
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/((?!api|_next|.*\\..*).*)",
  ],
};
