import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  tenant_name: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const u = await api.get<User>("/auth/me");
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const u = await api.post<User>("/auth/login", { email, password });
    setUser(u);
    return u;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return { user, loading, login, logout, refetch: fetchMe };
}
