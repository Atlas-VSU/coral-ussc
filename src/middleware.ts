import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/"];
const orgRoutes = ["/org-dashboard", "/org-events", "/org-members"];
const adminRoutes = ["/admin-dashboard", "/admin-students", "/admin-organization"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("session")?.value || null;
  const userRole = request.cookies.get("userRole")?.value || null;
  const isAuthenticated = !!token;

  if(isAuthenticated && publicRoutes.includes(pathname)) {
    console.log(userRole)
    if (userRole === "super-admin") {
      console.log("here")
      return NextResponse.redirect(new URL("/admin-dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/org-dashboard", request.url));
    } 
  }

  const isProtectedRoute = orgRoutes.some((route) => pathname.startsWith(route)) ||
    adminRoutes.some((route) => pathname.startsWith(route));
  
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated) {
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== "super-admin") {
        return NextResponse.redirect(new URL("/org-dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};