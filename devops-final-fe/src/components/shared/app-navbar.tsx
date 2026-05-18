"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DEFAULT_PROFILE_IMAGE, resolveProfileImage } from "@/lib/profile-image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { authService } from "@/services/auth.service";

interface NavbarUser {
  firstName: string;
  role?: string;
  profile_image?: string;
}

interface AppNavbarProps {
  user: NavbarUser;
  onToggleSidebar?: () => void;
}

function isSuperuserRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("superuser") || lowerRole.includes("super user") || lowerRole.includes("super_user");
}

function isWarehouseRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("warehouse") || lowerRole.includes("inventory");
}

function isAdminRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("admin");
}

function getHomePathByRole(role?: string): string {
  if (isAdminRole(role)) return "/users";
  if (isSuperuserRole(role)) return "/dashboard";
  if (isWarehouseRole(role)) return "/dashboard";
  return "/login";
}

// Sub-Components
function NavbarLogo({ role }: { role?: string }) {

  const router = useRouter();
  const homePath = getHomePathByRole(role);

  return (
    <Link
      href={homePath}
      onClick={(e) => {
        e.preventDefault();
        router.push(homePath);
      }}
      className="flex items-center gap-2"
      aria-label="Go to dashboard"
    >
      <div className="relative h-9 w-9 shrink-0 rounded-xl bg-[var(--surface-3)] p-1">
        <Image src="/logo.png" alt="ForgeStock Logo" fill className="object-contain" priority />
      </div>
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-wide">ForgeStock</span>
        <span className="text-xs text-white/70">Warehouse Control</span>
      </div>
    </Link>
  );
}

function ProfileDropdown() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch {
      // Force navigate even if API fails
      router.push('/login');
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-lg">
      <Link href="/profile" className="flex w-full items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50">
        <User size={16} />
        แก้ไขโปรไฟล์
      </Link>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={16} />
        ออกจากระบบ
      </button>
    </div>
  );
}

// Role-based avatar mapping
const ROLE_AVATAR_MAP: Record<string, string> = {
  warehouse: DEFAULT_PROFILE_IMAGE,
  inventory: DEFAULT_PROFILE_IMAGE,
  superuser: DEFAULT_PROFILE_IMAGE,
  admin: DEFAULT_PROFILE_IMAGE,
};


function getRoleAvatar(role?: string): string {
  if (!role) return ROLE_AVATAR_MAP.warehouse;
  if (isAdminRole(role)) {
    return ROLE_AVATAR_MAP.admin;
  }
  if (isSuperuserRole(role)) {
    return ROLE_AVATAR_MAP.superuser;
  }
  if (isWarehouseRole(role)) {
    return ROLE_AVATAR_MAP.warehouse;
  }
  return ROLE_AVATAR_MAP.warehouse;
}

function getRoleDisplayName(role?: string): string {
  if (!role) return "Warehouse Staff";
  if (isSuperuserRole(role)) {
    return "Super User";
  }
  if (isAdminRole(role)) {
    return "Admin";
  }
  if (role.toLowerCase().includes("inventory")) {
    return "Inventory Staff";
  }
  return "Warehouse Staff";
}

function UserAvatar({ user }: { user: NavbarUser }) {
  const avatarSrc = resolveProfileImage(user.profile_image) || getRoleAvatar(user.role);
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/40">
      <Image 
        src={avatarSrc} 
        alt={user.firstName} 
        fill 
        className="object-cover" 
        unoptimized
        priority
      />
    </div>
  );
}

// Main Component
export function AppNavbar({
  user,
  onToggleSidebar,
}: AppNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(() => setIsMenuOpen(false), menuRef);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)] text-white shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/20 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <NavbarLogo role={user.role} />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-white/70 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            Live Ops
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/10",
                isMenuOpen && "bg-white/10"
              )}
            >
              <UserAvatar user={user} />
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold leading-tight">{user.firstName}</span>
                <span className="text-xs text-white/70">{getRoleDisplayName(user.role)}</span>
              </div>
              <ChevronDown size={16} className="text-white/80" />
            </button>

            {isMenuOpen && <ProfileDropdown />}
          </div>
        </div>
      </div>
    </header>
  );
}
