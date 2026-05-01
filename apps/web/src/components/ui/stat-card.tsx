interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  sparkline?: number[];
  className?: string;
}

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg
      width={w}
      height={h}
      className={isPositive === false ? 'text-error-icon' : 'text-success-icon'}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({ label, value, trend, icon, sparkline, className = '' }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-6 text-card-foreground shadow-elevation-1 ${className}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-label-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-display-sm text-foreground">{value}</p>
          {trend && (
            <p
              className={`mt-1 text-label-sm ${
                trend.isPositive ? 'text-success-text' : 'text-error-text'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <MiniSparkline data={sparkline} isPositive={trend?.isPositive} />
        )}
      </div>
    </div>
  );
}
