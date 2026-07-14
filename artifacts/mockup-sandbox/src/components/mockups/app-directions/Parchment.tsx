import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Parchment() {
  const colors = {
    bg: '#f5f0e8',
    surface: '#ede8df',
    deep: '#e0d9ce',
    accent: '#8b5e3c',
    accentSecondary: '#6b7c6e',
    text: '#2c2017',
    textSecondary: '#8a7a65',
    border: 'rgba(44, 32, 23, 0.1)',
    highlight: '#d4a574',
  };

  const fonts = {
    body: '"Outfit", sans-serif',
    serif: '"Playfair Display", serif',
  };

  const Divider = () => (
    <div className="flex items-center justify-center my-12" style={{ color: colors.border }}>
      <div className="flex-grow h-px" style={{ backgroundColor: colors.border }}></div>
      <span className="mx-4 text-xs" style={{ color: colors.textSecondary }}>◆</span>
      <div className="flex-grow h-px" style={{ backgroundColor: colors.border }}></div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap');
      `}} />
      
      <div style={{ backgroundColor: colors.bg, minHeight: '100vh', fontFamily: fonts.body, color: colors.text }} className="w-full pb-24">
        {/* Navigation */}
        <nav className="w-full flex flex-col items-center pt-8">
          <h1 
            className="text-[12px] uppercase tracking-[0.15em] mb-4"
            style={{ color: colors.textSecondary }}
          >
            A-Moment
          </h1>
          <div className="w-full h-[1px]" style={{ backgroundColor: colors.border }}></div>
        </nav>

        {/* Main Container */}
        <div className="max-w-4xl mx-auto px-6 md:px-12 mt-16 flex flex-col gap-32">
          
          {/* SECTION 1: DASHBOARD */}
          <section>
            {/* Hero Greeting */}
            <div className="mb-16">
              <p 
                className="text-[10px] uppercase tracking-[0.15em] mb-4"
                style={{ color: colors.textSecondary }}
              >
                Wednesday, 14 July 2026
              </p>
              <h2 
                className="text-[64px] font-normal leading-none mb-6"
                style={{ fontFamily: fonts.serif, color: colors.text }}
              >
                Good afternoon,<br />
                Sophie.
              </h2>
              <p className="text-[14px] font-light" style={{ color: colors.textSecondary }}>
                Your upcoming celebrations are looking beautiful.
              </p>
            </div>

            <Divider />

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {/* Card 01 */}
              <div 
                className="flex flex-col justify-between p-8 aspect-[3/4]"
                style={{ backgroundColor: colors.surface }}
              >
                <div>
                  <span 
                    className="text-[80px] leading-none font-light block mb-6"
                    style={{ fontFamily: fonts.serif, color: colors.textSecondary }}
                  >
                    01
                  </span>
                  <h3 
                    className="text-2xl font-medium leading-tight mb-2"
                    style={{ fontFamily: fonts.serif }}
                  >
                    James & Emma<br />Wedding
                  </h3>
                </div>
                <div>
                  <div className="w-full h-px mb-4" style={{ backgroundColor: colors.border }}></div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      Sardinia · July
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      24 Guests
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 02 */}
              <div 
                className="flex flex-col justify-between p-8 aspect-[3/4]"
                style={{ backgroundColor: colors.deep }}
              >
                <div>
                  <span 
                    className="text-[80px] leading-none font-light block mb-6"
                    style={{ fontFamily: fonts.serif, color: colors.textSecondary }}
                  >
                    02
                  </span>
                  <h3 
                    className="text-2xl font-medium leading-tight mb-2"
                    style={{ fontFamily: fonts.serif }}
                  >
                    Birthday<br />Sophie, 40th
                  </h3>
                </div>
                <div>
                  <div className="w-full h-px mb-4" style={{ backgroundColor: colors.border }}></div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      London · Aug
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      60 Guests
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 03 */}
              <div 
                className="flex flex-col justify-between p-8 aspect-[3/4]"
                style={{ backgroundColor: colors.surface }}
              >
                <div>
                  <span 
                    className="text-[80px] leading-none font-light block mb-6"
                    style={{ fontFamily: fonts.serif, color: colors.textSecondary }}
                  >
                    03
                  </span>
                  <h3 
                    className="text-2xl font-medium leading-tight mb-2"
                    style={{ fontFamily: fonts.serif }}
                  >
                    Anniversary<br />Three Years
                  </h3>
                </div>
                <div>
                  <div className="w-full h-px mb-4" style={{ backgroundColor: colors.border }}></div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      Paris · Oct
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textSecondary }}>
                      2 Guests
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Create New CTA */}
            <div className="text-center mt-12 mb-24">
              <a 
                href="#" 
                className="text-[18px] inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                style={{ 
                  fontFamily: fonts.serif, 
                  color: colors.accent, 
                  fontStyle: 'italic',
                  textDecorationColor: colors.highlight,
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px',
                  textDecorationLine: 'underline'
                }}
              >
                Begin planning something extraordinary <ArrowRight size={16} />
              </a>
            </div>
          </section>

          {/* SECTION 2: EVENT HUB */}
          <section className="mt-8 border-t" style={{ borderColor: colors.border }}>
            <div className="pt-24 pb-8 text-center">
              <h2 
                className="text-[56px] font-normal leading-tight mb-6"
                style={{ fontFamily: fonts.serif, color: colors.text }}
              >
                James & Emma's<br />Wedding
              </h2>
              <p 
                className="text-[10px] uppercase tracking-[0.15em]"
                style={{ color: colors.textSecondary }}
              >
                Sardinia, Italy — Saturday 12 July 2025
              </p>
            </div>

            <Divider />

            {/* Table of Progress */}
            <div className="my-16 max-w-lg mx-auto">
              <h3 
                className="text-[12px] uppercase tracking-[0.15em] mb-12 text-center"
                style={{ color: colors.textSecondary }}
              >
                Table of Progress
              </h3>

              <div className="flex flex-col gap-6 text-[14px]">
                <div className="flex items-baseline">
                  <span className="w-8 text-right mr-4" style={{ fontFamily: fonts.serif, color: colors.textSecondary }}>i.</span>
                  <span>Event created</span>
                  <div className="flex-grow border-b border-dotted mx-4 relative top-[-4px]" style={{ borderColor: colors.textSecondary }}></div>
                  <span style={{ color: colors.textSecondary }}>Complete</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-8 text-right mr-4" style={{ fontFamily: fonts.serif, color: colors.textSecondary }}>ii.</span>
                  <span>Guests invited</span>
                  <div className="flex-grow border-b border-dotted mx-4 relative top-[-4px]" style={{ borderColor: colors.textSecondary }}></div>
                  <span style={{ color: colors.textSecondary }}>24 Confirmed</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-8 text-right mr-4" style={{ fontFamily: fonts.serif, color: colors.textSecondary }}>iii.</span>
                  <span>Planning options</span>
                  <div className="flex-grow border-b border-dotted mx-4 relative top-[-4px]" style={{ borderColor: colors.textSecondary }}></div>
                  <span style={{ color: colors.textSecondary }}>Review now</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-8 text-right mr-4" style={{ fontFamily: fonts.serif, color: colors.textSecondary }}>iv.</span>
                  <span style={{ color: colors.textSecondary }}>Celebration confirmed</span>
                  <div className="flex-grow border-b border-dotted mx-4 relative top-[-4px]" style={{ borderColor: colors.textSecondary }}></div>
                  <span style={{ color: colors.textSecondary }}>Pending</span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Status and Action */}
            <div className="my-16 text-center">
              <p className="text-[14px] leading-relaxed mb-12 max-w-md mx-auto" style={{ color: colors.textSecondary }}>
                <span style={{ color: colors.text }}>24 guests confirmed, 3 with dietary requirements.</span><br />
                Questionnaire sent and awaiting Sophie's response.
              </p>

              <button 
                className="w-full py-6 px-4 mb-10 transition-opacity hover:opacity-90 max-w-2xl mx-auto block"
                style={{ 
                  backgroundColor: colors.accent, 
                  color: '#ffffff',
                  fontFamily: fonts.serif,
                  fontSize: '20px',
                  fontStyle: 'italic',
                  borderRadius: '0px'
                }}
              >
                Begin planning conversation
              </button>

              <div className="flex justify-center gap-4 text-[13px] flex-wrap">
                <span style={{ color: colors.textSecondary }}>Quick actions:</span>
                <div className="flex gap-4">
                  <a href="#" style={{ color: colors.accent, textDecoration: 'underline', textDecorationColor: colors.highlight, textUnderlineOffset: '3px' }}>View guests</a>
                  <span style={{ color: colors.textSecondary }}>·</span>
                  <a href="#" style={{ color: colors.accent, textDecoration: 'underline', textDecorationColor: colors.highlight, textUnderlineOffset: '3px' }}>Review plan options</a>
                  <span style={{ color: colors.textSecondary }}>·</span>
                  <a href="#" style={{ color: colors.accent, textDecoration: 'underline', textDecorationColor: colors.highlight, textUnderlineOffset: '3px' }}>Send questionnaire</a>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    </>
  );
}
