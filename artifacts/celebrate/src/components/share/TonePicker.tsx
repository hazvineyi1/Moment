import React from 'react';

export interface ToneOption {
  id: string;
  label: string;
  emoji: string;
  desc?: string;
}

interface Props {
  label?: string;
  tones: readonly ToneOption[];
  value: string;
  onChange: (id: string) => void;
}

export function TonePicker({ label = 'Message tone', tones, value, onChange }: Props) {
  return (
    <div className="mb-5">
      <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>
        {label}
      </p>
      <div className={`grid gap-2 mb-0`} style={{ gridTemplateColumns: `repeat(${tones.length}, 1fr)` }}>
        {tones.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all text-center"
              style={{
                border: `1px solid ${active ? 'rgba(201,169,110,0.6)' : 'rgba(201,169,110,0.15)'}`,
                background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
              }}
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              <span className="text-xs font-medium leading-tight" style={{ color: active ? '#c9a96e' : '#f5f0e8' }}>
                {t.label}
              </span>
              {t.desc && (
                <span className="text-[9px] leading-tight" style={{ color: '#8a7a65' }}>
                  {t.desc}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
