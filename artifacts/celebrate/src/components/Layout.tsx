import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, CalendarHeart, User, Sparkles } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Hide nav on specific immersive routes if needed, e.g., plan chat
  const isChat = location.match(/\/events\/\d+\/plan/);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      
      {/* Top Navbar for desktop, or simplified top bar for mobile */}
      {!isChat && (
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/40">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-500" />
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">Cele</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className={`text-sm font-medium transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                Dashboard
              </Link>
              <Link href="/profile" className={`text-sm font-medium transition-colors ${location === '/profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                Profile
              </Link>
            </nav>

            <div className="md:hidden w-8" /> {/* Balance spacer for mobile */}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${isChat ? '' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
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
            <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
