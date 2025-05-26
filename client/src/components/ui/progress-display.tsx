import { Progress } from "@/components/ui/progress";

export function ProgressDisplay({ prog }: { prog: any }) {
  return (
    <div className="max-w-md mx-auto my-6 space-y-2">
      <Progress value={prog.pct ?? 0} />
      <p className="text-center text-sm text-muted-foreground">
        {prog.message ?? prog.phase} – {Math.round(prog.pct ?? 0)}%
      </p>
      {prog.phase === "error" && (
        <p className="text-destructive text-center text-sm">{prog.error}</p>
      )}
    </div>
  );
}
