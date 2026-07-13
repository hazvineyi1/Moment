import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, CalendarHeart, Sparkles, LogOut, User } from 'lucide-react';
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
      {!isChat && (
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/40">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-500" />
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">Cele</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className={`text-sm font-medium transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                Dashboard
              </Link>
              {user && (
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border/60">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {user.imageUrl
                      ? <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>
                    }
                    <span className="font-medium text-foreground">{user.firstName ?? user.emailAddresses[0]?.emailAddress}</span>
                  </div>
                  <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              )}
            </nav>

            <div className="md:hidden w-8" />
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col ${isChat ? '' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>

      {!isChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-border/40 pb-safe">
          <div className="flex items-center justify-around h-16 px-4">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/events/new" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === '/events/new' ? 'text-primary' : 'text-muted-foreground'}`}>
              <CalendarHeart className="w-5 h-5" />
              <span className="text-[10px] font-medium">New</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-medium">Sign out</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
