'use client';

import { AppFooter } from "@/components/shared/app-footer";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ALLOWED_ROLES = [
  "warehouse",
  "inventory",
  "superuser",
  "admin",
  "warehouse staff",
  "inventory staff",
  "super user",
];

type SidebarRole = "warehouse" | "inventory" | "superuser" | "admin";

function resolveSidebarRole(role?: string): SidebarRole {
  if (!role) return "warehouse";
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("admin")) return "admin";
  if (lowerRole.includes("super")) return "superuser";
  if (lowerRole.includes("inventory")) return "inventory";
  return "warehouse";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed, isReady } = useSidebarState();
  const sidebarRole = resolveSidebarRole(user?.role_name);

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="page-shell min-h-screen text-white">
        <AppNavbar
          user={{
            firstName: user?.first_name || "Operator",
            role: user?.role_name,
            profile_image: user?.profile_image,
          }}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="flex min-h-screen pt-16">
          <AppSidebar
            role={sidebarRole}
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            isReady={isReady}
            onClose={() => setIsSidebarOpen(false)}
            onCollapsedChange={setIsSidebarCollapsed}
          />

          <main
            className={cn(
              "flex-1 px-4 pb-10 pt-6 md:px-8",
              isReady && "transition-[margin-left] duration-300",
              isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
            )}
          >
            <div className="page-reveal mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>

        <div className={cn("mt-auto", isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72")}> 
          <AppFooter />
        </div>
      </div>
    </ProtectedRoute>
  );
}
