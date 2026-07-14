import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetEvent, useUpdateEvent } from '@workspace/api-client-react';
import { useAuth } from '@clerk/react';
import {
  ChevronDown, ChevronUp, Loader2, MapPin, Clock, Users, RefreshCw,
  Plane, Bus, Copy, Check, MessageSquare, Sparkles, CalendarDays,
  Camera, Download, X, Upload, WandSparkles,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface PlanOption {
  id: string;
  name: string;
  tagline: string;
  destination: string;
  venue: string;
  duration: string;
  priceRange: { perPersonMin: number; perPersonMax: number };
  flightEstimate?: { perPersonMin: number; perPersonMax: number; carriers: string[] };
  localTransport?: string[];
  highlights: string[];
  addOns: string[];
  whyThisWorks: string;
  vibe?: string;
  travelStyleMatch?: string;
  optimalTiming?: string;
}

const LOADING_LINES = [
  "Consulting my contact at the Aman…",
  "Checking availability on the Amalfi in August…",
  "Weighing your group against three very different itineraries…",
  "Ruling out the obvious. Finding the interesting.",
  "Matching venue character to your specific crowd…",
  "Nearly there. Six options worth your time.",
];

const VIZ_LOADING_LINES = [
  "Reading the room…",
  "Picturing your group in the scene…",
  "Composing the light and setting…",
  "Adding a touch of luxury…",
  "Almost there — finishing the frame…",
];

// ─── Visualize Modal ──────────────────────────────────────────────────────────

interface UploadedPhoto { file: File; preview: string }

function VisualizeModal({
  option,
  eventId,
  uploadedPhoto,
  onPhotoChange,
  cachedImage,
  onImageGenerated,
  onClose,
  getToken,
}: {
  option: PlanOption;
  eventId: number;
  uploadedPhoto: UploadedPhoto | null;
  onPhotoChange: (p: UploadedPhoto | null) => void;
  cachedImage: string | null;
  onImageGenerated: (optionId: string, img: string) => void;
  onClose: () => void;
  getToken: () => Promise<string | null>;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(cachedImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Cycle loading messages while generating
  useEffect(() => {
    if (!generating) return;
    setLineIdx(0);
    const t = setInterval(() => {
      setLineIdx(p => (p + 1 < VIZ_LOADING_LINES.length ? p + 1 : p));
    }, 4000);
    return () => clearInterval(t);
  }, [generating]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB.'); return; }
    setError('');
    setResultImage(null);
    const reader = new FileReader();
    reader.onload = e => onPhotoChange({ file, preview: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!uploadedPhoto) return;
    setGenerating(true);
    setError('');
    setResultImage(null);

    try {
      const token = await getToken();
      const form = new FormData();
      form.append('photo', uploadedPhoto.file);
      form.append('optionName', option.name);
      form.append('destination', option.destination);
      form.append('tagline', option.tagline);
      form.append('highlights', JSON.stringify(option.highlights));
      if (option.vibe) form.append('vibe', option.vibe);

      const res = await fetch(`${BASE}/api/events/${eventId}/visualize`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed. Try again.'); return; }

      setResultImage(data.image);
      onImageGenerated(option.id, data.image);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `${option.name.replace(/\s+/g, '-').toLowerCase()}-visualization.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto flex flex-col"
        style={{ background: '#0d0d0d', border: '1px solid rgba(201,169,110,0.18)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}
        >
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#c6b7a1' }}>
              Visualize your group here
            </p>
            <h2 className="font-serif text-lg leading-snug" style={{ color: '#f5f0e8' }}>
              {option.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#c6b7a1' }}>{option.destination}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 transition-opacity hover:opacity-60"
          >
            <X className="w-4 h-4" style={{ color: '#c6b7a1' }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Result image */}
          {resultImage && !generating && (
            <div className="space-y-3">
              <img
                src={resultImage}
                alt="Your group visualized in this experience"
                className="w-full rounded-sm object-cover"
                style={{ maxHeight: 340 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.12em] uppercase transition-all"
                  style={{ border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Save image
                </button>
                <button
                  onClick={() => setResultImage(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.12em] uppercase transition-all"
                  style={{ border: '1px solid rgba(201,169,110,0.1)', color: '#c6b7a1' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try again
                </button>
              </div>
              <p className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(138,122,101,0.5)' }}>
                AI-generated scene. The people shown represent your group based on the photo.
              </p>
            </div>
          )}

          {/* Upload zone */}
          {!resultImage && (
            <>
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase mb-2.5" style={{ color: '#c6b7a1' }}>
                  {uploadedPhoto ? 'Your photo' : 'Upload a photo of your group'}
                </p>

                {uploadedPhoto ? (
                  <div className="relative">
                    <img
                      src={uploadedPhoto.preview}
                      alt="Uploaded group photo"
                      className="w-full rounded-sm object-cover"
                      style={{ maxHeight: 200 }}
                    />
                    <button
                      onClick={() => { onPhotoChange(null); setResultImage(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(201,169,110,0.2)' }}
                    >
                      <X className="w-3.5 h-3.5" style={{ color: '#f5f0e8' }} />
                    </button>
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide rounded"
                      style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
                    >
                      <Upload className="w-3 h-3" /> Change
                    </button>
                  </div>
                ) : (
                  <div
                    ref={dropRef}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all rounded-sm"
                    style={{
                      border: `1px dashed ${dragging ? 'rgba(201,169,110,0.5)' : 'rgba(201,169,110,0.2)'}`,
                      background: dragging ? 'rgba(201,169,110,0.04)' : 'transparent',
                    }}
                  >
                    <Camera className="w-7 h-7" style={{ color: 'rgba(201,169,110,0.4)' }} />
                    <div className="text-center">
                      <p className="text-sm font-normal" style={{ color: '#c6b7a1' }}>
                        Drop a photo here, or tap to browse
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(138,122,101,0.5)' }}>
                        Works best with group photos · JPG, PNG, HEIC · up to 10 MB
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
              )}

              {/* Generate button */}
              {generating ? (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                  </div>
                  <p
                    key={lineIdx}
                    className="text-sm font-normal text-center animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ color: '#c6b7a1' }}
                  >
                    {VIZ_LOADING_LINES[lineIdx]}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(138,122,101,0.4)' }}>
                    This takes about 20–40 seconds
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!uploadedPhoto}
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-35"
                  style={{
                    background: uploadedPhoto ? 'rgba(201,169,110,0.08)' : 'transparent',
                    border: '1px solid rgba(201,169,110,0.3)',
                    color: '#c9a96e',
                  }}
                >
                  <WandSparkles className="w-4 h-4" />
                  Visualize us here
                </button>
              )}

              <p className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(138,122,101,0.45)' }}>
                A-Moment reads your photo to understand the look and feel of your group, then generates
                an original scene — your photo is never stored.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  option,
  index,
  onChoose,
  isChoosing,
  onVisualize,
  hasVisualization,
}: {
  option: PlanOption;
  index: number;
  onChoose: (option: PlanOption) => void;
  isChoosing: boolean;
  onVisualize: (option: PlanOption) => void;
  hasVisualization: boolean;
}) {
  const [showAddOns, setShowAddOns] = useState(false);

  const formatPrice = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300"
      style={{ border: '1px solid rgba(201,169,110,0.12)', background: '#242424' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.12)')}
    >
      {/* Header band */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-[11px] tracking-[0.22em] uppercase" style={{ color: '#c6b7a1' }}>
            Option {index + 1}
          </span>
          {option.vibe && (
            <span
              className="text-[11px] tracking-[0.15em] uppercase px-2.5 py-1 flex-shrink-0"
              style={{ border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
            >
              {option.vibe}
            </span>
          )}
        </div>
        <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-2" style={{ color: '#f5f0e8' }}>{option.name}</h2>
        <p className="text-sm font-normal leading-relaxed" style={{ color: '#c6b7a1' }}>{option.tagline}</p>

        {option.travelStyleMatch && (
          <div className="mt-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: '#c9a96e' }} />
            <span className="text-xs tracking-[0.12em] uppercase" style={{ color: '#c9a96e' }}>
              Matched to your style —{' '}
              <span className="font-medium">{option.travelStyleMatch}</span>
            </span>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="px-6 pb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.destination}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.duration}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.venue}
        </span>
        {option.optimalTiming && (
          <span className="flex items-center gap-1.5" style={{ color: '#c9a96e' }}>
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            {option.optimalTiming}
          </span>
        )}
      </div>

      {/* Pricing block */}
      <div className="px-6 pb-4 space-y-2">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <span className="text-xs tracking-[0.15em] uppercase" style={{ color: '#c6b7a1' }}>Stay + experiences</span>
          <span className="font-serif text-xl" style={{ color: '#c9a96e' }}>
            {formatPrice(option.priceRange.perPersonMin)}–{formatPrice(option.priceRange.perPersonMax)}
            <span className="text-xs font-normal ml-1" style={{ color: '#c6b7a1' }}>pp</span>
          </span>
        </div>

        {option.flightEstimate && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(201,169,110,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <Plane className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c6b7a1' }} />
              <div>
                <span className="text-xs tracking-[0.12em] uppercase" style={{ color: '#c6b7a1' }}>Flights (round-trip)</span>
                {option.flightEstimate.carriers?.length > 0 && (
                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(138,122,101,0.6)' }}>
                    {option.flightEstimate.carriers.join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <span className="text-base font-normal" style={{ color: '#f5f0e8' }}>
              {formatPrice(option.flightEstimate.perPersonMin)}–{formatPrice(option.flightEstimate.perPersonMax)}
              <span className="text-xs ml-1" style={{ color: '#c6b7a1' }}>pp</span>
            </span>
          </div>
        )}
      </div>

      <div className="px-6 pb-4">
        <div className="h-px bg-border/50" />
      </div>

      {/* Highlights */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">What's included</p>
        <ul className="space-y-2">
          {option.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Local transport */}
      {option.localTransport && option.localTransport.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">Getting around</p>
          <ul className="space-y-1.5">
            {option.localTransport.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Bus className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add-ons toggle */}
      {option.addOns?.length > 0 && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowAddOns((p) => !p)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAddOns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAddOns ? 'Hide' : 'Show'} optional upgrades ({option.addOns.length})
          </button>
          {showAddOns && (
            <ul className="mt-3 space-y-1.5">
              {option.addOns.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 flex-shrink-0">+</span> {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Why this works */}
      <div className="px-6 pb-5">
        <div className="bg-muted/50 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">A-Moment's take</p>
          <p className="text-sm leading-relaxed italic text-foreground/80">{option.whyThisWorks}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-6 space-y-2">
        {/* Visualize button */}
        <button
          onClick={() => onVisualize(option)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-xs tracking-[0.18em] uppercase transition-all"
          style={{
            border: '1px solid rgba(201,169,110,0.18)',
            color: hasVisualization ? '#c9a96e' : '#c6b7a1',
            background: hasVisualization ? 'rgba(201,169,110,0.05)' : 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'; e.currentTarget.style.color = '#c9a96e'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.18)'; e.currentTarget.style.color = hasVisualization ? '#c9a96e' : '#c6b7a1'; }}
        >
          <Camera className="w-3.5 h-3.5" />
          {hasVisualization ? 'View visualization ✦' : 'See your group here ✦'}
        </button>

        {/* Choose CTA */}
        <button
          onClick={() => onChoose(option)}
          disabled={isChoosing}
          className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-50"
          style={{
            border: '1px solid rgba(201,169,110,0.3)',
            color: '#c9a96e',
            background: 'rgba(201,169,110,0.04)',
          }}
        >
          <span>{isChoosing ? 'Locking in your plan…' : 'Choose this plan'}</span>
          <span className="font-normal tracking-[-0.08em] text-base">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLineIdx((p) => (p + 1 < LOADING_LINES.length ? p + 1 : p));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8 relative">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-3">A-Moment is thinking.</h2>
      <p
        key={lineIdx}
        className="text-muted-foreground text-base max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {LOADING_LINES[lineIdx]}
      </p>
    </div>
  );
}

// ─── Share bar ────────────────────────────────────────────────────────────────

function formatOptionsMessage(eventTitle: string, options: PlanOption[]): string {
  const lines: string[] = [`🎉 6 ideas for ${eventTitle}:`, ''];
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
  options.forEach((opt, i) => {
    lines.push(`${i + 1}. ${opt.name}`);
    lines.push(`   ${opt.tagline}`);
    lines.push(`   📍 ${opt.destination} · ${opt.duration} · ${fmt(opt.priceRange.perPersonMin)}–${fmt(opt.priceRange.perPersonMax)} pp`);
    if (i < options.length - 1) lines.push('');
  });
  lines.push('', 'Which catches your eye?');
  return lines.join('\n');
}

function ShareOptionsBar({ options, eventTitle }: { options: PlanOption[]; eventTitle: string }) {
  const [copied, setCopied] = useState(false);
  const message = formatOptionsMessage(eventTitle, options);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="mt-12 p-6"
      style={{ border: '1px solid rgba(201,169,110,0.18)', background: 'rgba(201,169,110,0.03)' }}
    >
      <p className="uppercase text-xs tracking-[0.22em] mb-4" style={{ color: '#c6b7a1', borderBottom: '1px solid rgba(201,169,110,0.1)', paddingBottom: '12px' }}>
        Share these options
      </p>
      <p className="text-sm font-normal mb-5" style={{ color: '#c6b7a1' }}>
        Send all 6 plans to a friend or partner so they can weigh in before you decide.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.35)', color: copied ? '#c9a96e' : '#f5f0e8', background: copied ? 'rgba(201,169,110,0.08)' : 'transparent' }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.2)', color: '#c6b7a1' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#c6b7a1')}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={() => { window.location.href = `sms:?body=${encodeURIComponent(message)}`; }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.2)', color: '#c6b7a1' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#c6b7a1')}
        >
          <MessageSquare className="w-4 h-4" />
          iMessage / SMS
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function EventOptions() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);

  const { data: event } = useGetEvent(id, { query: { enabled: !!id } });
  const { getToken } = useAuth();
  const updateEvent = useUpdateEvent();

  const [options, setOptions] = useState<PlanOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState(false);

  // Visualization state
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto | null>(null);
  const [visualizeOption, setVisualizeOption] = useState<PlanOption | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());

  const handleImageGenerated = useCallback((optionId: string, img: string) => {
    setGeneratedImages(prev => new Map(prev).set(optionId, img));
  }, []);

  const loadOptions = async (force = false) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setOptions(null);
    try {
      const token = await getToken();
      const url = `/api/events/${id}/plan-options${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.options) || data.options.length === 0) {
        throw new Error('No options returned');
      }
      setOptions(data.options);
    } catch (e: any) {
      console.error('plan-options fetch error:', e);
      setError(e.message ?? 'Something went wrong. Try again?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadOptions();
  }, [id]);

  const handleChoose = async (option: PlanOption) => {
    if (!id || choosing) return;
    setChoosing(true);

    const existingDesc = event?.description ?? '';
    const baseDesc = existingDesc.includes('__CHOSEN_PLAN__:')
      ? existingDesc.slice(0, existingDesc.indexOf('__CHOSEN_PLAN__:')).trim()
      : existingDesc;

    const newDescription = `${baseDesc}${baseDesc ? '\n' : ''}__CHOSEN_PLAN__:${JSON.stringify(option)}`;

    updateEvent.mutate(
      { eventId: id, data: { description: newDescription } },
      {
        onSuccess: () => setLocation(`/events/${id}/plan`),
        onError: () => setChoosing(false),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="h-px" style={{ background: '#c9a96e' }} />

      <div className="flex-1 mx-auto px-8 md:px-16 py-8 md:py-12 max-w-7xl w-full">
        {loading && <LoadingState />}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => loadOptions(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {options && !loading && (
          <>
            <div className="mb-8">
              <p className="uppercase text-xs tracking-[0.22em] mb-4" style={{ color: '#c9a96e' }}>
                Your options
              </p>
              <h1 className="font-serif text-4xl md:text-6xl mb-4" style={{ color: '#f5f0e8' }}>
                Six directions.{' '}
                <span className="italic" style={{ color: '#c6b7a1' }}>Pick one.</span>
              </h1>
              <p className="text-base font-normal max-w-lg leading-relaxed" style={{ color: '#c6b7a1' }}>
                Each is a real, specific plan. Once you choose, A-Moment will help you lock in every detail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {options.map((opt, i) => (
                <PlanCard
                  key={opt.id}
                  option={opt}
                  index={i}
                  onChoose={handleChoose}
                  isChoosing={choosing}
                  onVisualize={setVisualizeOption}
                  hasVisualization={generatedImages.has(opt.id)}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => loadOptions(true)}
                className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-colors"
                style={{ color: '#c6b7a1' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a96e')}
                onMouseLeave={e => (e.currentTarget.style.color = '#c6b7a1')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>None of these. Show me different options</span>
              </button>
            </div>

            <ShareOptionsBar options={options} eventTitle={event?.title ?? 'your event'} />
          </>
        )}
      </div>

      {/* Visualize Modal */}
      {visualizeOption && (
        <VisualizeModal
          option={visualizeOption}
          eventId={id}
          uploadedPhoto={uploadedPhoto}
          onPhotoChange={setUploadedPhoto}
          cachedImage={generatedImages.get(visualizeOption.id) ?? null}
          onImageGenerated={handleImageGenerated}
          onClose={() => setVisualizeOption(null)}
          getToken={getToken}
        />
      )}
    </div>
  );
}
