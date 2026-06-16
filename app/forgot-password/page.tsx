"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSent(true)
    }, 600)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[var(--success)]/12 text-[var(--success)]">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold">Check your inbox</h1>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">{email}</span>, you&apos;ll
                  receive a reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-6" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-semibold">Forgot password?</h1>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
