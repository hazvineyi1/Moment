import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ObsidianMockup() {
  return (
    <div 
      className="min-h-screen relative w-full overflow-x-hidden selection:bg-[#c9a96e] selection:text-[#0a0a0a]"
      style={{
        backgroundColor: '#0a0a0a',
        color: '#f5f0e8',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 300,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400&family=Playfair+Display:ital,wght@0,400;1,400;1,500&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        .font-sans {
          font-family: 'Outfit', sans-serif;
        }
        
        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 50;
          opacity: 0.15;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>
      
      <div className="noise-overlay" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
        {/* Nav */}
        <nav className="flex justify-between items-center py-8">
          <div className="font-serif italic text-2xl tracking-wide" style={{ color: '#f5f0e8' }}>
            A-Moment
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden" style={{ border: '1px solid rgba(201, 169, 110, 0.15)' }}>
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80" 
              alt="James" 
              className="w-full h-full object-cover" 
            />
          </div>
        </nav>

        {/* Hero */}
        <header className="mt-24 mb-32">
          <h1 className="font-serif italic text-[72px] leading-tight md:text-[80px]" style={{ color: '#f5f0e8' }}>
            Good evening,<br />
            James.
          </h1>
        </header>

        {/* Dashboard Section */}
        <section className="mb-40">
          <h2 className="font-sans uppercase text-[10px] tracking-[0.2em] mb-8" style={{ color: '#8a7a65' }}>
            Upcoming Celebrations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Card 1 */}
            <div className="relative group cursor-pointer" style={{ backgroundColor: '#141414' }}>
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1542314831-c5a42a1f8b8c?auto=format&fit=crop&q=80&w=800" 
                  alt="Birthday in London" 
                  className="w-full h-[70%] object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute bottom-0 left-0 w-full h-[30%] p-6 flex flex-col justify-end" style={{ backgroundColor: '#141414' }}>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-2xl mb-1 text-[#f5f0e8]">Birthday</h3>
                      <p className="font-sans text-[#8a7a65] text-sm font-light mt-1">London</p>
                    </div>
                    <div className="uppercase text-[9px] tracking-[0.2em] px-2 py-1" style={{ border: '1px solid rgba(201, 169, 110, 0.3)', color: '#c9a96e' }}>
                      24 GUESTS
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="relative group cursor-pointer" style={{ backgroundColor: '#141414' }}>
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800" 
                  alt="Wedding in Amalfi" 
                  className="w-full h-[70%] object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute bottom-0 left-0 w-full h-[30%] p-6 flex flex-col justify-end" style={{ backgroundColor: '#141414' }}>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-2xl mb-1 text-[#f5f0e8]">Wedding</h3>
                      <p className="font-sans text-[#8a7a65] text-sm font-light mt-1">Amalfi</p>
                    </div>
                    <div className="uppercase text-[9px] tracking-[0.2em] px-2 py-1" style={{ border: '1px solid rgba(201, 169, 110, 0.3)', color: '#c9a96e' }}>
                      CONFIRMED
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative group cursor-pointer" style={{ backgroundColor: '#141414' }}>
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800" 
                  alt="Anniversary in Tokyo" 
                  className="w-full h-[70%] object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0" 
                />
                <div className="absolute bottom-0 left-0 w-full h-[30%] p-6 flex flex-col justify-end" style={{ backgroundColor: '#141414' }}>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-2xl mb-1 text-[#f5f0e8]">Anniversary</h3>
                      <p className="font-sans text-[#8a7a65] text-sm font-light mt-1">Tokyo</p>
                    </div>
                    <div className="uppercase text-[9px] tracking-[0.2em] px-2 py-1" style={{ border: '1px solid rgba(201, 169, 110, 0.3)', color: '#8a8278' }}>
                      DRAFT
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button className="group flex items-center gap-4 text-[#c9a96e] hover:text-[#f5f0e8] transition-colors duration-300">
              <span className="font-sans text-sm tracking-widest uppercase">+ Begin planning something extraordinary</span>
              <span className="font-light tracking-[-0.1em] text-lg group-hover:translate-x-2 transition-transform duration-300">-----&gt;</span>
            </button>
          </div>
        </section>

        {/* Separator */}
        <div className="w-full h-px my-24" style={{ background: 'linear-gradient(90deg, rgba(201,169,110,0) 0%, rgba(201,169,110,0.5) 50%, rgba(201,169,110,0) 100%)' }} />

        {/* Event Hub Section */}
        <section className="pb-32">
          <button className="flex items-center gap-3 text-[#8a8278] hover:text-[#c9a96e] transition-colors mb-16 uppercase text-[10px] tracking-[0.2em]">
            <ArrowLeft className="w-4 h-4" strokeWidth={1} /> Back
          </button>

          <header className="mb-20">
            <h1 className="font-serif text-[56px] text-[#f5f0e8] mb-6">James & Emma's Wedding</h1>
            <p className="uppercase text-[11px] tracking-[0.3em] text-[#8a7a65]">
              Sardinia, Italy <span className="mx-3 text-[#c9a96e]">·</span> Saturday 12 July 2025
            </p>
          </header>

          <div className="w-full h-px mb-16" style={{ background: 'rgba(201,169,110,0.15)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column - Details */}
            <div className="lg:col-span-7">
              <h2 className="font-serif italic text-3xl mb-12 text-[#f5f0e8]">Plan your celebration</h2>
              
              {/* Timeline */}
              <div className="relative mb-20 px-2">
                <div className="absolute top-[5px] left-0 w-full h-[1px]" style={{ background: 'rgba(201,169,110,0.15)' }} />
                <div className="absolute top-[5px] left-0 w-3/4 h-[1px]" style={{ background: '#c9a96e' }} />
                
                <div className="relative flex justify-between">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#c9a96e' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] text-[#c9a96e] mt-1">Created</span>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#c9a96e' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] text-[#c9a96e] mt-1">Guests</span>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#c9a96e' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] text-[#c9a96e] mt-1">Insights</span>
                  </div>
                  <div className="flex flex-col items-center gap-4 relative">
                    <div className="absolute -top-[4px] -left-[4px] w-[19px] h-[19px] rounded-full animate-ping opacity-20" style={{ background: '#c9a96e' }} />
                    <div className="w-[11px] h-[11px] rounded-full relative z-10" style={{ background: '#c9a96e', boxShadow: '0 0 10px rgba(201,169,110,0.5)' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] text-[#f5f0e8] mt-1">Plan</span>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#141414', border: '1px solid rgba(201,169,110,0.3)' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] text-[#8a8278] mt-1">Chat</span>
                  </div>
                </div>
              </div>

              {/* Guest Preview */}
              <div className="mt-16">
                <h3 className="uppercase text-[10px] tracking-[0.2em] text-[#8a7a65] mb-6">Guest Preview</h3>
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" className="w-12 h-12 rounded-full border-[3px] object-cover relative z-30" style={{ borderColor: '#0a0a0a' }} alt="Guest" />
                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80" className="w-12 h-12 rounded-full border-[3px] object-cover relative z-20" style={{ borderColor: '#0a0a0a' }} alt="Guest" />
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" className="w-12 h-12 rounded-full border-[3px] object-cover relative z-10" style={{ borderColor: '#0a0a0a' }} alt="Guest" />
                    <div className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center text-[#c9a96e] text-xs font-light relative z-0" style={{ borderColor: '#0a0a0a', backgroundColor: '#141414' }}>
                      +21
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#f5f0e8] text-sm">24 guests confirmed</span>
                    <span className="text-[#8a8278] text-xs">3 dietary requirements noted</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Action Panel */}
            <div className="lg:col-span-5">
              <div className="p-10 relative overflow-hidden" style={{ border: '1px solid rgba(201,169,110,0.15)', backgroundColor: 'rgba(201,169,110,0.02)' }}>
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a96e] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />
                
                <h3 className="font-serif italic text-2xl text-[#f5f0e8] mb-8 relative z-10">Ready to build your perfect day?</h3>
                
                <button className="w-full py-4 px-6 flex justify-between items-center group transition-all duration-300 relative z-10" style={{ backgroundColor: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.3)' }}>
                  <span className="text-[#c9a96e] uppercase text-[11px] tracking-[0.2em] group-hover:text-[#f5f0e8] transition-colors">Chat with your concierge</span>
                  <span className="text-[#c9a96e] font-light tracking-[-0.1em] text-lg group-hover:translate-x-2 transition-transform">---&gt;</span>
                </button>

                <div className="w-full h-px my-10 relative z-10" style={{ background: 'rgba(201,169,110,0.15)' }} />

                <ul className="space-y-6 relative z-10">
                  <li className="flex items-center gap-4 text-[#f5f0e8]">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#c9a96e]" />
                    <span className="font-light text-sm">Guests (24 confirmed)</span>
                  </li>
                  <li className="flex items-center gap-4 text-[#f5f0e8]">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#c9a96e]" />
                    <span className="font-light text-sm">Choose a plan</span>
                  </li>
                  <li className="flex items-center gap-4 text-[#8a8278]">
                    <div className="w-[5px] h-[5px] rounded-full border border-[#8a8278]" />
                    <span className="font-light text-sm">Send questionnaire</span>
                  </li>
                </ul>

                <p className="mt-12 font-serif italic text-[#8a7a65] text-lg text-center px-4 relative z-10">
                  "Your AI concierge is ready to build something special."
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
