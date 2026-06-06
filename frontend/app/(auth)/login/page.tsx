"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { authService } from "@/components/auth/auth-service";

// ─── Spring Boot response shape (AuthResponse.java) ───────────────────────────
interface SpringAuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MANAGER" | "DRIVER";
  organizationId: string;
  organizationName: string;
  organizationMode: "SOLO" | "FLEET";
}

// ─── Routing logic ─────────────────────────────────────────────────────────────
// ADMIN or any FLEET org → fleet/admin dashboard
// MANAGER or DRIVER in SOLO org → personal dashboard
function resolveRedirect(
  role: SpringAuthResponse["role"],
  mode: SpringAuthResponse["organizationMode"],
): string {
  if (role === "ADMIN" || mode === "FLEET") {
    return "/dashboard"; // TODO: replace with "/fleet-dashboard" once that route exists
  }
  return "/dashboard";
}

// ─── localStorage keys (single source of truth) ───────────────────────────────
const TOKEN_KEY = "jwt_token";
const ROLE_KEY = "role";
const ORG_MODE_KEY = "org_mode";
const USER_KEY = "user_profile";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Check for session expired error on initial load only
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── The only thing that matters ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Use authService to call backend
      const auth = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      // Step 2: Store in localStorage — no cookies, no IndexedDB, no mock layer
      localStorage.setItem(TOKEN_KEY, auth.accessToken);
      localStorage.setItem(ROLE_KEY, auth.user.role);
      localStorage.setItem(ORG_MODE_KEY, auth.user.organizationMode);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          id: auth.user.id,
          email: auth.user.email,
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
          role: auth.user.role,
          organizationId: auth.user.organizationId,
          organizationName: auth.user.organizationName,
          organizationMode: auth.user.organizationMode,
        }),
      );

      // Step 3: Route based on what the DATABASE says the user is
      router.push(resolveRedirect(auth.user.role, auth.user.organizationMode));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Truck className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Vehicle Expense</h1>
          <p className="text-xs text-muted-foreground">SA Fleet Management</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to manage your vehicle expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.co.za"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-12"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-12 pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        SARS Compliant Logbook &bull; ZAR Currency &bull; SA Tax Year
      </p>
    </div>
  );
}
