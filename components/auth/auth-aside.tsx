import { CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/brand/logo"

const highlights = [
  "Role-based dashboards for admins, managers and employees",
  "Track projects, tasks, deadlines and work logs in one place",
  "Beautiful reports and real-time activity timelines",
]

// Decorative marketing panel shown on the left of the auth screens.
export function AuthAside() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15), transparent 45%)",
        }}
      />
      <div className="relative">
        <Logo className="[&_span]:text-primary-foreground [&>div]:bg-primary-foreground/15 [&>div]:text-primary-foreground" />
      </div>

      <div className="relative flex flex-col gap-6">
        <h1 className="font-heading text-3xl font-semibold leading-tight text-balance">
          Plan, track and ship work your whole team can rally behind.
        </h1>
        <ul className="flex flex-col gap-3">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5 text-sm text-primary-foreground/90">
              <CheckCircle2 className="mt-0.5 size-4.5 shrink-0" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/70">
        Trusted by product teams to coordinate thousands of tasks every week.
      </p>
    </aside>
  )
}
