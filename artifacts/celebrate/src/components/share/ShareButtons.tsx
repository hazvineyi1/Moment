import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  /** Sent via WhatsApp and used as the copy fallback. */
  fullMessage: string;
  /** Sent via SMS (shorter). */
  shortMessage: string;
  /** What the Copy button puts on the clipboard. Defaults to fullMessage. */
  copyContent?: string;
  /** Label on the copy button. Defaults to "Copy message". */
  copyLabel?: string;
}

export function ShareButtons({ fullMessage, shortMessage, copyContent, copyLabel = 'Copy message' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');

  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shortMessage)}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyContent ?? fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 py-3 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <span className="text-lg">💬</span> WhatsApp
        </button>
        <button
          onClick={handleSMS}
          className="flex items-center justify-center gap-2 py-3 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <span className="text-lg">📱</span> iMessage / SMS
        </button>
      </div>
      <button
        onClick={handleCopy}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all mb-8 ${
          copied ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {copied ? (
          <><Check className="w-4 h-4" /> Copied!</>
        ) : (
          <><Copy className="w-4 h-4" /> {copyLabel}</>
        )}
      </button>
    </>
  );
}
