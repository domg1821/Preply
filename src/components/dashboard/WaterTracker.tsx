'use client';
import { Droplets } from 'lucide-react';

interface WaterTrackerProps {
  glasses: number;
  goal?: number;
  onSet: (n: number) => void;
}

export function WaterTracker({ glasses, goal = 8, onSet }: WaterTrackerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-[var(--text)]">Water</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{glasses} / {goal} glasses</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < glasses;
          return (
            <button
              key={i}
              onClick={() => onSet(filled && i === glasses - 1 ? glasses - 1 : i + 1)}
              title={filled ? 'Remove glass' : 'Add glass'}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150 active:scale-95"
              style={{
                background: filled
                  ? 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08))'
                  : 'var(--surface-2)',
                border: `1px solid ${filled ? 'rgba(96,165,250,0.3)' : 'var(--border)'}`,
              }}
            >
              <Droplets
                size={16}
                className={filled ? 'text-blue-400' : 'text-[var(--border-2)]'}
                style={{ fill: filled ? 'rgba(96,165,250,0.5)' : 'none' }}
              />
            </button>
          );
        })}
      </div>
      {glasses >= goal && (
        <p className="text-xs text-blue-400 text-center mt-2">
          🎉 Daily goal reached!
        </p>
      )}
    </div>
  );
}
