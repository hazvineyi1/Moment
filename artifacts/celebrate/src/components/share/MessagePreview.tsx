import React from 'react';

interface Props {
  message: string;
  className?: string;
}

export function MessagePreview({ message, className = 'mb-6' }: Props) {
  return (
    <div
      className={`rounded-xl px-4 py-4 ${className}`}
      style={{ background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.12)' }}
    >
      <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: '#8a7a65' }}>
        Preview
      </p>
      <p className="text-xs font-light leading-relaxed whitespace-pre-wrap" style={{ color: '#f5f0e8' }}>
        {message}
      </p>
    </div>
  );
}
