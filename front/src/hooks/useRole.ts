import { useMemo } from "react";
import type { User } from "./useAuth";

export type Role = "ADMIN" | "USER";

export function useRole(user: User | null) {
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role]);
  const isUser = useMemo(() => user?.role === "USER", [user?.role]);

  const canAccessAdmin = isAdmin;
  const canSeeAllAgents = isAdmin;
  const canCreateUsers = isAdmin;
  const canAssignAgents = isAdmin;
  const canUseAgentBuilder = isAdmin;

  return {
    role: user?.role as Role | undefined,
    isAdmin,
    isUser,
    canAccessAdmin,
    canSeeAllAgents,
    canCreateUsers,
    canAssignAgents,
    canUseAgentBuilder,
  };
}
