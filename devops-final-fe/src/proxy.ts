import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route permissions
const BASE_ROUTES = [
  '/dashboard',
  '/inventory',
  '/transactions',
  '/warehouse',
  '/profile',
];

const WAREHOUSE_ROUTES = [...BASE_ROUTES];
const INVENTORY_ROUTES = [...BASE_ROUTES];

const SUPERUSER_ROUTES = Array.from(new Set([
  ...BASE_ROUTES,
  '/audit',
  '/users',
]));

const ADMIN_ROUTES = Array.from(new Set([
  ...BASE_ROUTES,
  '/audit',
  '/users',
]));

const ROLE_ROUTES: Record<string, string[]> = {
  warehouse: WAREHOUSE_ROUTES,
  inventory: INVENTORY_ROUTES,
  superuser: SUPERUSER_ROUTES,
  admin: ADMIN_ROUTES,
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  // Exact match for home page
  if (pathname === '/') {
    return true;
  }
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Get allowed routes for a role
function getAllowedRoutes(role: string): string[] {
  const normalizedRole = role.toLowerCase().trim();
  if (normalizedRole.includes('warehouse')) return ROLE_ROUTES.warehouse;
  if (normalizedRole.includes('inventory')) return ROLE_ROUTES.inventory;
  if (normalizedRole.includes('super user') || normalizedRole.includes('super_user') || normalizedRole.includes('superuser')) {
    return ROLE_ROUTES.superuser;
  }
  if (normalizedRole.includes('admin')) return ROLE_ROUTES.admin;
  return ROLE_ROUTES[normalizedRole] || [];
}

// Check if user has access to route
function hasAccess(pathname: string, role: string): boolean {
  const allowedRoutes = getAllowedRoutes(role);
  return allowedRoutes.some(route => pathname.startsWith(route));
}

// Get default route for role
function getDefaultRoute(role: string): string {
  const normalizedRole = role.toLowerCase().trim();
  if (normalizedRole.includes('admin')) return '/users';
  if (normalizedRole.includes('inventory')) return '/inventory';
  if (normalizedRole.includes('warehouse')) return '/dashboard';
  if (normalizedRole.includes('super user') || normalizedRole.includes('super_user') || normalizedRole.includes('superuser')) {
    return '/dashboard';
  }
  return '/login';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // No token - redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // No role cookie - redirect to login (incomplete auth state)
  if (!userRole) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check if user has access to this route
  const allowed = hasAccess(pathname, userRole);

  if (!allowed) {
    const defaultRoute = getDefaultRoute(userRole);
    const url = request.nextUrl.clone();
    url.pathname = defaultRoute;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};