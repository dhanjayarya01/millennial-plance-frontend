"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { AuthAside } from "@/components/auth/auth-aside"
import { Logo } from "@/components/brand/logo"
import { DemoCredentials } from "@/components/auth/demo-credentials"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { user, loading, login, register } = useAuth()
  const router = useRouter()

  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("ROLE_EMPLOYEE")
  
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      if (isSignUp) {
        const result = await register({
          fullName,
          username,
          email,
          password,
          role,
        })
        if (result.ok) {
          setSuccessMessage("Account created successfully! Admin/Manager verification is required before you can log in.")
          setIsSignUp(false)
          setFullName("")
          setUsername("")
          setPassword("")
        } else {
          setError(result.error ?? "Registration failed. Please try again.")
        }
      } else {
        const result = await login(email, password)
        if (result.ok) {
          router.replace("/dashboard")
        } else {
          setError(result.error ?? "Invalid email or password.")
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <AuthAside />

      <div className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl font-semibold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? "Join your team space and start tracking projects."
                : "Sign in to your workspace to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="ROLE_EMPLOYEE">Employee</option>
                    <option value="ROLE_PROJECT_MANAGER">Project Manager</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                {successMessage}
              </p>
            )}

            <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Sign up"
                : "Sign in"}
            </Button>
          </form>

          <div className="my-6 h-px bg-border" />

          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {!isSignUp && (
            <>
              <div className="my-6 h-px bg-border" />
              <DemoCredentials
                onPick={(e, p) => {
                  setEmail(e)
                  setPassword(p)
                  setError(null)
                }}
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
