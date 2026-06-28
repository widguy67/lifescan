import { cn } from "@/lib/utils";

export function ConfidenceRing({
  value,
  size = 88,
  stroke = 8,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, value)) / 100) * circ;
  const tone = value >= 85 ? "text-success" : value >= 60 ? "text-primary" : "text-warning";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn(tone, "transition-[stroke-dashoffset] duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-xl font-bold leading-none">{Math.round(value)}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">match</span>
      </div>
    </div>
  );
}
