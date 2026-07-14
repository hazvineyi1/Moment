import React from 'react';
import { ArrowLeft } from 'lucide-react';

// Variation B — "Magazine Spread"
// What's refined: asymmetric hero layout (large featured card + two stacked cards),
// serif event title overlaid directly on hero image,
// greeting at refined scale with an event count,
// all text ON the images (no separate info panel below),
// stronger editorial tension and luxury-magazine feel.

export default function ObsidianB() {
  return (
    <div
      className="min-h-screen relative w-full overflow-x-hidden"
      style={{
        backgroundColor: '#0a0a0a',
        color: '#f5f0e8',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 300,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        .ob-serif { font-family: 'Playfair Display', serif; }
        .ob-sans  { font-family: 'Outfit', sans-serif; }

        .ob-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 50;
          opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        .ob-hero-card:hover .ob-hero-img  { transform: scale(1.04); }
        .ob-hero-img { transition: transform 0.8s ease; }
        .ob-sm-card:hover .ob-sm-img  { transform: scale(1.06); }
        .ob-sm-img { transition: transform 0.7s ease; }
      `}</style>

      <div className="ob-noise" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16">

        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav className="flex justify-between items-center py-6">
          <div className="ob-serif italic text-2xl tracking-wide" style={{ color: '#f5f0e8' }}>
            A-Moment
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span className="ob-sans uppercase text-[10px] tracking-[0.2em]" style={{ color: '#8a7a65' }}>James</span>
            <div
              className="w-10 h-10 rounded-full overflow-hidden"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80"
                alt="James"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </nav>

        {/* ── Greeting — compact with count ───────────────────────────── */}
        <header style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h1
              className="ob-serif italic leading-[0.92]"
              style={{ fontSize: 'clamp(44px, 6vw, 72px)', color: '#f5f0e8' }}
            >
              Good evening,<br />James.
            </h1>
            {/* Event count — editorial aside */}
            <div style={{ textAlign: 'right', paddingBottom: '6px' }}>
              <div className="ob-serif" style={{ fontSize: '48px', color: 'rgba(201,169,110,0.25)', lineHeight: 1 }}>
                03
              </div>
              <p className="ob-sans uppercase text-[9px] tracking-[0.25em]" style={{ color: '#8a7a65', marginTop: '4px' }}>
                Celebrations
              </p>
            </div>
          </div>
          {/* Gold thin rule under greeting */}
          <div
            style={{
              marginTop: '24px',
              height: '1px',
              background: 'linear-gradient(90deg, rgba(201,169,110,0.5) 0%, rgba(201,169,110,0.1) 60%, rgba(201,169,110,0) 100%)',
            }}
          />
        </header>

        {/* ── Asymmetric card grid ─────────────────────────────────────── */}
        {/*  [  Hero card — 7/12  ] [ Side card 1 ]  */}
        {/*                         [ Side card 2 ]  */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '16px', marginBottom: '16px', alignItems: 'stretch' }}>

          {/* Hero card */}
          <div
            className="ob-hero-card"
            style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/5', cursor: 'pointer' }}
          >
            <img
              className="ob-hero-img"
              src="/__mockup/images/venue-wedding-amalfi.jpg"
              alt="Wedding in Amalfi"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 35%, rgba(10,10,10,0.1) 65%, rgba(10,10,10,0) 100%)',
              }}
            />
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
              <span
                className="ob-sans"
                style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid rgba(201,169,110,0.4)', color: '#c9a96e', background: 'rgba(10,10,10,0.4)' }}
              >
                Featured
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px' }}>
              <p className="ob-sans" style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '12px', color: 'rgba(245,240,232,0.5)' }}>
                Amalfi · July 2025
              </p>
              <h2 className="ob-serif" style={{ fontSize: '36px', lineHeight: 1.15, marginBottom: '16px', color: '#f5f0e8' }}>
                James & Emma's<br />Wedding
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="ob-sans" style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(245,240,232,0.6)' }}>
                  48 guests · Confirmed
                </span>
                <button className="ob-sans" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Open <span style={{ fontSize: '14px', letterSpacing: '-0.08em' }}>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right column — two stacked small cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Small card 1 */}
            <div
              className="ob-sm-card"
              style={{ position: 'relative', overflow: 'hidden', flex: 1, minHeight: 0, cursor: 'pointer' }}
            >
              <img
                className="ob-sm-img"
                src="/__mockup/images/venue-birthday-london.jpg"
                alt="Birthday in London"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.2) 55%, rgba(10,10,10,0) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="ob-serif" style={{ fontSize: '20px', lineHeight: 1.1, color: '#f5f0e8' }}>Birthday</h3>
                  <p className="ob-sans" style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '4px', color: 'rgba(245,240,232,0.5)' }}>
                    London · Aug
                  </p>
                </div>
                <div className="ob-sans" style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e' }}>
                  24 GST
                </div>
              </div>
            </div>

            {/* Small card 2 */}
            <div
              className="ob-sm-card"
              style={{ position: 'relative', overflow: 'hidden', flex: 1, minHeight: 0, cursor: 'pointer' }}
            >
              <img
                className="ob-sm-img"
                src="/__mockup/images/venue-anniversary-tokyo.jpg"
                alt="Anniversary in Tokyo"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(70%)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.2) 55%, rgba(10,10,10,0) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="ob-serif" style={{ fontSize: '20px', lineHeight: 1.1, color: '#f5f0e8' }}>Anniversary</h3>
                  <p className="ob-sans" style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '4px', color: 'rgba(245,240,232,0.5)' }}>
                    Tokyo · Sep
                  </p>
                </div>
                <div className="ob-sans" style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(138,122,101,0.3)', color: '#8a7a65' }}>
                  DRAFT
                </div>
              </div>
            </div>

            {/* New event slot */}
            <div
              className="ob-sans relative cursor-pointer flex items-center justify-center"
              style={{
                minHeight: '80px',
                border: '1px solid rgba(201,169,110,0.12)',
                background: 'transparent',
              }}
            >
              <span
                className="uppercase text-[10px] tracking-[0.25em]"
                style={{ color: 'rgba(201,169,110,0.45)' }}
              >
                + New celebration
              </span>
            </div>
          </div>
        </div>

        {/* ── CTA strip ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between py-5"
          style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}
        >
          <button
            className="ob-sans group flex items-center gap-4 uppercase transition-colors"
            style={{ color: '#c9a96e', fontSize: '11px', letterSpacing: '0.2em' }}
          >
            Begin planning something extraordinary
            <span style={{ fontSize: '16px', letterSpacing: '-0.08em' }}>———›</span>
          </button>
          <span className="ob-sans text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(138,122,101,0.4)' }}>
            July 2025
          </span>
        </div>

        {/* ── Separator ────────────────────────────────────────────────── */}
        <div
          style={{
            height: '1px',
            margin: '56px 0',
            background: 'linear-gradient(90deg, rgba(201,169,110,0) 0%, rgba(201,169,110,0.5) 50%, rgba(201,169,110,0) 100%)',
          }}
        />

        {/* ── Event Hub ────────────────────────────────────────────────── */}
        <section className="pb-24">
          <button
            className="ob-sans flex items-center gap-3 uppercase text-[10px] tracking-[0.22em] mb-12"
            style={{ color: '#8a7a65' }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1} /> Back
          </button>

          <header className="mb-14">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="ob-sans uppercase text-[9px] tracking-[0.22em] px-2.5 py-1"
                    style={{ border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e' }}
                  >
                    Wedding
                  </span>
                  <span
                    className="ob-sans uppercase text-[9px] tracking-[0.22em] px-2.5 py-1"
                    style={{ border: '1px solid rgba(201,169,110,0.15)', color: '#8a7a65' }}
                  >
                    Planning
                  </span>
                </div>
                <h1
                  className="ob-serif leading-tight"
                  style={{ fontSize: '52px', color: '#f5f0e8', marginBottom: '16px' }}
                >
                  James & Emma's<br />Wedding
                </h1>
                <p className="ob-sans uppercase text-[10px] tracking-[0.28em]" style={{ color: '#8a7a65' }}>
                  Sardinia · 12 July 2025
                </p>
              </div>
              {/* Progress numeral aside */}
              <div style={{ textAlign: 'right', paddingBottom: '8px' }}>
                <div className="ob-serif" style={{ fontSize: '64px', color: 'rgba(201,169,110,0.2)', lineHeight: 1 }}>
                  72%
                </div>
                <p className="ob-sans uppercase text-[9px] tracking-[0.22em]" style={{ color: 'rgba(138,122,101,0.6)', marginTop: '4px' }}>
                  Complete
                </p>
              </div>
            </div>
          </header>

          <div
            className="h-px mb-14"
            style={{ background: 'rgba(201,169,110,0.12)' }}
          />

          {/* Two-col layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '48px' }}>
            <div>
              {/* Journey dots — same as before */}
              <div className="relative px-2 mb-12">
                <div className="absolute top-[5px] left-2 right-2 h-px" style={{ background: 'rgba(201,169,110,0.12)' }} />
                <div className="absolute top-[5px] left-2 h-px" style={{ background: '#c9a96e', width: '75%' }} />
                <div className="relative flex justify-between">
                  {['Created', 'Guests', 'Insights', 'Plan', 'Chat'].map((step, i) => {
                    const done = i < 3; const current = i === 3;
                    return (
                      <div key={step} className="flex flex-col items-center gap-3">
                        <div className="relative">
                          {current && <div className="absolute rounded-full animate-ping opacity-20" style={{ inset: '-4px', background: '#c9a96e' }} />}
                          <div
                            className="w-[11px] h-[11px] rounded-full relative z-10"
                            style={{
                              background: done || current ? '#c9a96e' : 'transparent',
                              border: done || current ? 'none' : '1px solid rgba(201,169,110,0.2)',
                              boxShadow: current ? '0 0 10px rgba(201,169,110,0.5)' : 'none',
                            }}
                          />
                        </div>
                        <span className="ob-sans uppercase text-[9px] tracking-[0.18em]"
                          style={{ color: done || current ? (current ? '#f5f0e8' : '#c9a96e') : '#8a7a65' }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next steps */}
              <p className="ob-sans uppercase text-[10px] tracking-[0.22em] mb-5" style={{ color: '#8a7a65' }}>Next steps</p>
              {['Confirm final headcount', 'Share questionnaire link', 'Review venue proposal'].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3.5"
                  style={{ borderBottom: '1px solid rgba(201,169,110,0.07)' }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: i === 0 ? '#c9a96e' : 'transparent', border: i === 0 ? 'none' : '1px solid rgba(201,169,110,0.3)' }}
                  />
                  <span className="ob-sans text-sm font-light" style={{ color: i === 0 ? '#c9a96e' : '#f5f0e8' }}>{s}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="p-8" style={{ border: '1px solid rgba(201,169,110,0.15)', background: 'rgba(201,169,110,0.02)' }}>
                <h3 className="ob-serif italic text-xl mb-6" style={{ color: '#f5f0e8' }}>Ready to build your perfect day?</h3>
                <button
                  className="ob-sans w-full py-4 px-5 flex justify-between items-center mb-6"
                  style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.3)' }}
                >
                  <span className="uppercase text-[10px] tracking-[0.2em]" style={{ color: '#c9a96e' }}>Chat with your concierge</span>
                  <span style={{ color: '#c9a96e', fontSize: '16px', letterSpacing: '-0.08em' }}>→</span>
                </button>
                {['Guests (24)', 'Choose a plan', 'Questionnaire'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-[5px] h-[5px] rounded-full" style={{ background: i < 2 ? '#c9a96e' : 'transparent', border: i < 2 ? 'none' : '1px solid rgba(138,122,101,0.4)' }} />
                    <span className="ob-sans text-sm font-light" style={{ color: i < 2 ? '#f5f0e8' : '#8a7a65' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
