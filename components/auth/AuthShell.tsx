import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 py-12">
      {/* soft pastel blobs */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-secondary/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-6 h-96 w-96 rounded-full bg-accent/70 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-28 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />

      <div className="relative mx-auto flex max-w-md flex-col gap-8">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-card/70 shadow-sm backdrop-blur soft-hover">
            <span className="font-display text-lg">✦</span>
          </div>
          <h1 className="font-display text-3xl tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Form surface */}
        <Card className="soft-card p-6 soft-hover">
          {children}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Calm planning, cozy analytics, AI at the center.
        </p>
      </div>
    </div>
  );
}