"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  UserRole,
  OrganizationMode,
  type User,
  type Organization,
} from "@/lib/types/database";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationMode: OrganizationMode;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSoloMode: boolean;
  isFleetMode: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDriver: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Use the centralized API client (handles headers automatically)
        const response = await api.get('/auth/me');
        // Handle both { user: ... } and flat response formats
        setUser(response.data.user || response.data);
      } catch (error) {
        console.error("Auth check failed:", error);
        // The api client helper already handles 401/403 token clearing,
        // so we just set user to null here.
        setUser(null);
        localStorage.removeItem('jwt_token'); // Safety clear
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Use api client for consistent error handling
      const data = await api.post('/auth/login', { email, password });

      // Save token to localStorage (must be BEFORE redirect)
      if (data.accessToken) {
        localStorage.setItem("jwt_token", data.accessToken);
        localStorage.setItem("role", data.user?.role || data.role);
        localStorage.setItem("org_mode", data.user?.organizationMode || data.organizationMode);
        localStorage.setItem("user_profile", JSON.stringify(data.user || data));
      }

      setUser(data.user || data);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    // Clear the real JWT from localStorage (our auth mechanism)
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("role");
    localStorage.removeItem("org_mode");
    localStorage.removeItem("user_profile");
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      // Handle both { user: ... } and flat response formats
      setUser(response.data.user || response.data);
    } catch (error) {
      console.error("Refresh user failed:", error);
      // The api client already handles 401/403 token clearing
      setUser(null);
      localStorage.removeItem('jwt_token'); // Safety clear
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSoloMode: user?.organizationMode === OrganizationMode.SOLO,
    isFleetMode: user?.organizationMode === OrganizationMode.FLEET,
    isAdmin: user?.role === UserRole.ADMIN,
    isManager: user?.role === UserRole.MANAGER,
    isDriver: user?.role === UserRole.DRIVER,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isLoading };
}

/**
 * Hook to require specific role
 */
export function useRequireRole(...roles: UserRole[]) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !roles.includes(user.role)) {
      router.push("/dashboard"); // Redirect to dashboard if wrong role
    }
  }, [isLoading, user, roles, router]);

  return { user, isLoading };
}
