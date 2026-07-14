import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Plus, LogOut, User } from 'lucide-react';
import { useClerk, useUser } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const isChat = location.match(/\/events\/\d+\/plan/);

  const handleSignOut = () => signOut({ redirectUrl: basePath || '/' });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      {/* Film-grain noise texture */}
      <div className="noise-overlay" aria-hidden="true" />

      {!isChat && (
        <header className="relative z-40 w-full" style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          <div className="mx-auto px-8 md:px-16 h-20 flex items-center justify-between max-w-7xl">
            <Link href="/" className="group">
              <span
                className="font-serif italic text-2xl tracking-wide transition-opacity group-hover:opacity-70"
                style={{ color: '#f5f0e8' }}
              >
                A-Moment
              </span>
            </Link>

            <div className="flex items-center gap-6">
              {user && (
                <>
                  {/* Desktop: minimal avatar + signout */}
                  <div className="hidden md:flex items-center gap-5">
                    <span className="text-xs tracking-[0.15em] uppercase" style={{ color: '#8a7a65' }}>
                      {user.firstName ?? user.emailAddresses[0]?.emailAddress?.split('@')[0]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-xs tracking-[0.12em] uppercase transition-colors hover:text-foreground"
                      style={{ color: '#8a7a65' }}
                    >
                      Sign out
                    </button>
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                      style={{ border: '1px solid rgba(201,169,110,0.2)' }}
                    >
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile: just avatar */}
                  <div
                    className="md:hidden w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(201,169,110,0.2)' }}
                  >
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col ${isChat ? '' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>

      {/* Mobile bottom nav — minimal */}
      {!isChat && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(201,169,110,0.1)',
          }}
        >
          <div className="flex items-center justify-around h-16 px-4">
            <Link
              href="/"
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
              style={{ color: location === '/' ? '#c9a96e' : '#8a7a65' }}
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[9px] tracking-[0.12em] uppercase">Home</span>
            </Link>
            <Link
              href="/events/new"
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
              style={{ color: location === '/events/new' ? '#c9a96e' : '#8a7a65' }}
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[9px] tracking-[0.12em] uppercase">New</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
              style={{ color: '#8a7a65' }}
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[9px] tracking-[0.12em] uppercase">Out</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
