// Utility for role display name
export function getRoleDisplayName(role?: string): string {
  if (!role) return "Warehouse Staff";
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("inventory")) {
    return "Inventory Staff";
  }
  if (lowerRole.includes("super")) {
    return "Super User";
  }
  if (lowerRole.includes("admin")) {
    return "Admin";
  }
  return "Warehouse Staff";
}
