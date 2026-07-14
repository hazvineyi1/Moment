import React from 'react';
import { ArrowRight, Check, MessageSquare, MapPin, Calendar, Users, Star, ArrowLeft } from 'lucide-react';

export default function Prism() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
        
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .text-gradient {
          background: linear-gradient(to right, #7c3aed, #db2777);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .bg-gradient-primary {
          background: linear-gradient(to right, #7c3aed, #db2777);
        }
        
        .glow-primary {
          box-shadow: 0 0 40px -10px rgba(124, 58, 237, 0.5), 0 0 40px -10px rgba(219, 39, 119, 0.5);
        }
        
        .orb-1 {
          background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(15, 10, 30, 0) 70%);
        }
        
        .orb-2 {
          background: radial-gradient(circle, rgba(219, 39, 119, 0.25) 0%, rgba(15, 10, 30, 0) 70%);
        }

        .orb-3 {
          background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, rgba(15, 10, 30, 0) 70%);
        }
        
        /* Shimmer */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      
      <div className="min-h-screen bg-[#0f0a1e] text-[#f8fafc] font-outfit relative overflow-x-hidden selection:bg-violet-500/30 pb-20">
        
        {/* Ambient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] orb-1 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] orb-2 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute top-[70%] left-[10%] w-[700px] h-[700px] orb-3 blur-[100px] pointer-events-none rounded-full" />

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 glass-card border-x-0 border-t-0 px-6 py-4 flex justify-between items-center rounded-none">
          <div className="font-outfit font-semibold text-xl tracking-widest text-gradient">A-MOMENT</div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-pink-600 p-[1px] cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#0f0a1e] flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
          </div>
        </nav>

        {/* SECTION 1: DASHBOARD */}
        <div className="pt-32 px-6 max-w-6xl mx-auto pb-12 relative z-10">
          <div className="mb-6 text-[#a78bfa] text-[11px] font-medium tracking-[0.2em] uppercase">
            Good Evening
          </div>
          <h1 className="text-5xl md:text-[80px] font-light leading-[1.1] mb-16">
            Plan something<br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">extraordinary.</span>
          </h1>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x hide-scrollbar">
            {/* Card 1 */}
            <div className="min-w-[320px] md:min-w-[380px] glass-card rounded-3xl p-8 relative overflow-hidden group snap-start cursor-pointer hover:bg-white/[0.06] transition-colors border border-white/5 hover:border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-violet-400" />
              <div className="mb-16">
                <h3 className="text-3xl font-light mb-3">Birthday bash</h3>
                <div className="text-[13px] text-white/50 tracking-wide flex items-center gap-2">
                  <span>London</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>Jul 12</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-white/70">12 guests</div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#a78bfa]/50 group-hover:bg-[#a78bfa]/10 transition-colors">
                  <ArrowRight size={16} className="text-white/70 group-hover:text-white" />
                </div>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="min-w-[320px] md:min-w-[380px] glass-card rounded-3xl p-8 relative overflow-hidden group snap-start cursor-pointer hover:bg-white/[0.06] transition-colors border border-white/5 hover:border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-rose-400" />
              <div className="mb-16">
                <h3 className="text-3xl font-light mb-3">Wedding weekend</h3>
                <div className="text-[13px] text-white/50 tracking-wide flex items-center gap-2">
                  <span>Amalfi</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>Aug 3</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-white/70">56 guests</div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-pink-400/50 group-hover:bg-pink-400/10 transition-colors">
                  <ArrowRight size={16} className="text-white/70 group-hover:text-white" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="min-w-[320px] md:min-w-[380px] glass-card rounded-3xl p-8 relative overflow-hidden group snap-start cursor-pointer hover:bg-white/[0.06] transition-colors border border-white/5 hover:border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="mb-16">
                <h3 className="text-3xl font-light mb-3">Anniversary night</h3>
                <div className="text-[13px] text-white/50 tracking-wide flex items-center gap-2">
                  <span>Tokyo</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>Sep 20</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-white/70">2 guests</div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-emerald-400/50 group-hover:bg-emerald-400/10 transition-colors">
                  <ArrowRight size={16} className="text-white/70 group-hover:text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center">
            <button className="bg-gradient-primary glow-primary shimmer rounded-full px-8 py-4 text-sm font-medium tracking-wide flex items-center gap-3 hover:scale-105 transition-transform">
              <span>Begin a new celebration</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Section Divider */}
        <div className="h-px w-full max-w-6xl mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent my-16" />

        {/* SECTION 2: EVENT HUB */}
        <div className="px-6 max-w-6xl mx-auto relative z-10">
          <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-12 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to dashboard</span>
          </button>
          
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight">James & Emma's Wedding</h2>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-[15px] tracking-wide">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-[#a78bfa]" /> <span>Sardinia</span></div>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2"><Calendar size={16} className="text-[#a78bfa]" /> <span>Saturday 12 July</span></div>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2"><Users size={16} className="text-[#a78bfa]" /> <span>56 guests</span></div>
            </div>
          </div>
          
          {/* Progress Tracker */}
          <div className="mb-20">
            <div className="h-[2px] w-full bg-white/5 rounded-full mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[60%] bg-gradient-primary" />
            </div>
            
            <div className="flex justify-between text-[11px] font-medium tracking-[0.15em] uppercase px-1">
              <div className="flex items-center gap-2 text-white/50">
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center"><Check size={10} /></div>
                <span className="hidden sm:inline">Created</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center"><Check size={10} /></div>
                <span className="hidden sm:inline">Guests</span>
              </div>
              <div className="flex items-center gap-3 text-[#a78bfa]">
                <div className="w-4 h-4 rounded-full bg-gradient-primary glow-primary flex-shrink-0" />
                <span className="text-white">Plan</span>
              </div>
              <div className="flex items-center gap-2 text-white/30">
                <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                <span className="hidden sm:inline">Chat</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column 65% */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card rounded-[32px] p-8 md:p-10 flex flex-col justify-between min-h-[220px]">
                  <div className="text-[72px] font-light leading-none mb-4 tracking-tight">56</div>
                  <div className="text-[#a78bfa] text-[11px] font-medium tracking-widest uppercase">Guests confirmed</div>
                </div>
                <div className="glass-card rounded-[32px] p-8 md:p-10 flex flex-col justify-between min-h-[220px]">
                  <div className="text-[72px] font-light leading-none mb-4 tracking-tight text-[#fbbf24]">3</div>
                  <div className="text-[#a78bfa] text-[11px] font-medium tracking-widest uppercase">Plans ready to review</div>
                </div>
              </div>
              
              <div className="glass-card rounded-[32px] p-8 md:p-10">
                <div className="mb-6 text-[11px] font-medium tracking-widest uppercase text-white/40">Quick Actions</div>
                <div className="flex flex-wrap gap-4">
                  <button className="glass-card px-6 py-4 rounded-full text-[15px] flex items-center gap-3 hover:border-white/20 hover:bg-white/[0.08] transition-all group">
                    <span>Guest list</span>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  <button className="glass-card px-6 py-4 rounded-full text-[15px] flex items-center gap-3 hover:border-white/20 hover:bg-white/[0.08] transition-all group">
                    <span>Plans</span>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  <button className="glass-card px-6 py-4 rounded-full text-[15px] flex items-center gap-3 hover:border-white/20 hover:bg-white/[0.08] transition-all group">
                    <span>Questionnaire</span>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column 35% */}
            <div className="lg:col-span-4">
              <div className="glass-card rounded-[32px] p-8 md:p-10 h-full flex flex-col relative overflow-hidden group min-h-[400px]">
                <div className="absolute -bottom-20 -right-20 w-80 h-80 orb-2 blur-[60px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_-5px_rgba(167,139,250,0.3)]">
                  <Star size={24} className="text-[#a78bfa]" />
                </div>
                
                <h3 className="text-3xl font-light mb-4 tracking-tight">Chat with AI concierge</h3>
                <p className="text-white/60 text-[16px] leading-[1.7] mb-12 flex-1 font-light">
                  "Your private planning suite is ready. Shall we finalize the catering options for Friday evening?"
                </p>
                
                <button className="w-full glass-card hover:bg-white/[0.08] transition-colors border border-white/10 rounded-2xl p-5 flex items-center justify-between group-hover:border-[#db2777]/30 mt-auto">
                  <span className="text-[15px] font-medium">Open chat</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MessageSquare size={14} className="text-[#a78bfa]" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
