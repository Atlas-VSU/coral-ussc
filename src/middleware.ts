import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/"];
const orgRoutes = ["/org-dashboard", "/org-events", "/org-members", "/org-fines", "/org-fees", "/org-payments"];
const adminRoutes = ["/admin-dashboard", "/admin-students", "/admin-organization"];
const superAdminRoutes = ["/super-admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("session")?.value || null;
  const userRole = request.cookies.get("userRole")?.value || null;
  const isAuthenticated = !!token;

  // Redirect authenticated users away from public routes
  if (isAuthenticated && publicRoutes.includes(pathname)) {
    if (userRole === "super-admin") {
      return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/org-dashboard", request.url));
    }
  }

  const isMaintenance = process.env.MAINTENANCE_MODE === "true";

  // redirect to maintenance page if in maintenance mode and not already on it
  if (isMaintenance && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Prevent access to maintenance page when not in maintenance mode
  if (!isMaintenance && pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isOrgRoute = orgRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isSuperAdminRoute = superAdminRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = isOrgRoute || isAdminRoute || isSuperAdminRoute;

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated) {
    // Only super-admins can access admin-level and super-admin routes
    if ((isAdminRoute || isSuperAdminRoute) && userRole !== "super-admin") {
      return NextResponse.redirect(new URL("/org-dashboard", request.url));
    }

    // Super-admins trying to access org routes are redirected to their dashboard
    if (isOrgRoute && userRole === "super-admin") {
      return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};