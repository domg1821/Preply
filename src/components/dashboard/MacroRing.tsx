interface MacroRingProps {
  value: number;
  goal: number;
  color: string;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
}

export function MacroRing({ value, goal, color, label, unit, size = 90, strokeWidth = 7 }: MacroRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const offset = circumference * (1 - pct);
  const remaining = Math.max(goal - value, 0);
  const over = value > goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border-2)" strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={over ? '#EF4444' : color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={over ? 0 : offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-[var(--text)]" style={{ fontSize: size < 80 ? '11px' : '14px' }}>
            {Math.round(value)}
          </span>
          <span className="text-[var(--text-muted)]" style={{ fontSize: '10px' }}>{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[var(--text)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {over ? <span className="text-red-400">+{Math.round(value - goal)} over</span> : `${Math.round(remaining)} left`}
        </p>
      </div>
    </div>
  );
}
