import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-8" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-5xl font-semibold tracking-tight">404</p>
        <h1 className="font-heading text-xl font-semibold">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Link href="/dashboard">
        <Button size="lg">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>
      </Link>
    </main>
  )
}
