import React, { useState } from 'react';
import { ArrowUp, Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#000000] text-[#f6f8f5] pt-20 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-neutral-800">
          
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <a 
              href="https://breakpointsocial.com/"
              className="inline-block group"
              aria-label="Breakpoint Social Home"
            >
              {logoLoaded ? (
                <img 
                  src="https://breakpointsocial.com/wp-content/uploads/2025/04/breakpoint-logo-updated.png" 
                  alt="Breakpoint Social Logo" 
                  className="h-10 w-auto object-contain brightness-0 invert opacity-95 transition-opacity group-hover:opacity-100"
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-tighter text-white font-display">
                    BREAKPOINT
                  </span>
                  <span className="text-[#f1d5a0] font-script text-2xl font-bold -rotate-6">
                    social
                  </span>
                </div>
              )}
            </a>

            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              Breakpoint Social is a San Diego-based social media and influencer marketing agency. We engineer strategic campaigns that spark movements, not just posts.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.tiktok.com/@breakpointsocial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-[#84572f] hover:border-[#84572f] transition-all text-xs font-bold"
                aria-label="TikTok"
              >
                TT
              </a>
              <a
                href="https://www.instagram.com/breakpoint_social/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-[#84572f] hover:border-[#84572f] transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/nick-toth-8129b8358/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-[#84572f] hover:border-[#84572f] transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <a href="https://breakpointsocial.com/" className="hover:text-[#f1d5a0] transition-colors">Home</a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/about-us/" className="hover:text-[#f1d5a0] transition-colors">About Us</a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/services/" className="hover:text-[#f1d5a0] transition-colors">Services</a>
              </li>
              <li>
                <a href="#case-studies" className="text-[#f1d5a0] font-semibold hover:underline">Our Work (Portfolio)</a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/testimonials/" className="hover:text-[#f1d5a0] transition-colors">Testimonials</a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/blog/" className="hover:text-[#f1d5a0] transition-colors">Blog</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-white mb-4">
              Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <a href="https://breakpointsocial.com/services/#Social_Media_Management" className="hover:text-[#f1d5a0] transition-colors">
                  Social Media Management
                </a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/services/#Creative_Production" className="hover:text-[#f1d5a0] transition-colors">
                  Creative Production
                </a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/services/#Brand_Development_Positioning" className="hover:text-[#f1d5a0] transition-colors">
                  Brand Development
                </a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/services/#Event_Marketing" className="hover:text-[#f1d5a0] transition-colors">
                  Event Marketing
                </a>
              </li>
              <li>
                <a href="https://breakpointsocial.com/services/#Campaign_Reporting_Insights" className="hover:text-[#f1d5a0] transition-colors">
                  Campaign Insights
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact info */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-white mb-4">
              Get in Touch
            </h4>
            <div className="space-y-3 text-xs text-neutral-400">
              <div>
                <p className="text-white font-medium">Taylor</p>
                <a href="mailto:taylor@breakpointsocial.com" className="hover:text-[#f1d5a0] block transition-colors">
                  taylor@breakpointsocial.com
                </a>
                <a href="tel:+18183125428" className="hover:text-[#f1d5a0] block transition-colors">
                  +1 (818) 312-5428
                </a>
              </div>
              <div className="pt-2 border-t border-neutral-900">
                <p className="text-white font-medium">Nick Toth</p>
                <a href="mailto:nick.toth@breakpointsocial.com" className="hover:text-[#f1d5a0] block transition-colors">
                  nick.toth@breakpointsocial.com
                </a>
                <a href="tel:+13107753944" className="hover:text-[#f1d5a0] block transition-colors">
                  +1 (310) 775-3944
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2025 Breakpoint Social - All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span>San Diego, California</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
