import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

/* Used only before the CMS has published any pages. */
const FALLBACK_NAV = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About Us', path: '/about-us/' },
  { id: 'services', label: 'Services', path: '/services/' },
  { id: 'work', label: 'Our Work', path: '/our-work/' },
  { id: 'testimonials', label: 'Testimonials', path: '/testimonials/' },
  { id: 'blog', label: 'Blog', path: '/blog/' },
  { id: 'contact', label: 'Contact Us', path: '/contact-us/' },
];

interface HeaderProps {
  onOpenContact: () => void;
  nav?: Array<{ id: string | number; label: string; path: string }>;
}

export const Header: React.FC<HeaderProps> = ({ onOpenContact, nav }) => {
  /*
   * The pages the CMS publishes, so this header and the one on every other
   * page cannot disagree about what the site contains. The hand-written list
   * this replaced had drifted already: no Our Work, no Contact Us, and an
   * on-page anchor where the Our Work page should have been.
   */
  const items = nav && nav.length > 0 ? nav : FALLBACK_NAV;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-[#fcf5e9]/90 backdrop-blur-md border-b border-[#84572f]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Zone 1: Single text element wordmark / Brand logo */}
          <div className="flex items-center">
            <a 
              href="/"
              className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[#84572f]"
              aria-label="Breakpoint Social Home"
            >
              {logoLoaded ? (
                <img 
                  src="/images/breakpoint-logo.png" 
                  alt="Breakpoint Social Logo" 
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-102"
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-tighter text-[#141615] font-display">
                    BREAKPOINT
                  </span>
                  <span className="text-[#84572f] font-script text-2xl font-bold -rotate-6">
                    social
                  </span>
                </div>
              )}
            </a>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1c1c1c]/80">
            {items.map((item) =>
              item.path === '/' ? (
                <a
                  key={item.id}
                  href={item.path}
                  className="text-[#84572f] font-semibold flex items-center gap-1.5 transition-colors"
                  aria-current="page"
                >
                  <span>{item.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#84572f]" aria-hidden="true" />
                </a>
              ) : (
                <a
                  key={item.id}
                  href={item.path}
                  className="hover:text-[#84572f] transition-colors"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={onOpenContact}
              className="px-5 py-2.5 text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#84572f]"
            >
              Let’s Work Together
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1c1c1c] hover:text-[#84572f] focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fcf5e9] border-b border-[#84572f]/15 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.path}
              className={
                item.path === '/'
                  ? 'block px-3 py-2 text-base font-semibold text-[#84572f] bg-[#f1d5a0]/30 rounded-lg'
                  : 'block px-3 py-2 text-base font-medium text-[#1c1c1c] hover:bg-[#92ada4]/15 rounded-lg'
              }
              aria-current={item.path === '/' ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-3 text-center text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full"
            >
              Let’s Work Together
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
