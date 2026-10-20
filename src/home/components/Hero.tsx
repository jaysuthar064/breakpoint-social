import React from 'react';
import { ArrowDown, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';

interface HeroProps {
  onScrollToCampaigns: () => void;
  onSelectFeatured: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToCampaigns, onSelectFeatured }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#84572f]/10">
      {/* Subtle brand ambient glow */}
      <div 
        className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#f1d5a0]/40 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-[#92ada4]/30 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#84572f]">
            OUR WORK
          </span>
          <span className="h-px w-12 bg-[#84572f]/30" aria-hidden="true" />
          <span className="text-xs text-[#1c1c1c]/60 font-medium">
            Portfolio &amp; Case Studies
          </span>
        </div>

        {/* Marquee Headline */}
        <div className="max-w-4xl">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#141615] tracking-tight leading-[1.08] font-display text-balance">
            Creative Campaigns. <br />
            <span className="text-[#84572f] relative inline-block">
              Real Impact.
              <span className="absolute left-0 bottom-1 w-full h-2 bg-[#f1d5a0]/60 -z-10 rounded-sm" />
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#1c1c1c]/80 leading-relaxed font-normal max-w-2xl">
            Explore the creative campaigns, influencer collaborations, and social strategies we’ve brought to life for our partners.
          </p>

          <p className="mt-2 text-sm text-[#84572f] font-script text-xl sm:text-2xl">
            From perfection to personality — social movements, not just posts.
          </p>
        </div>

        {/* Actions & Proof Bar */}
        <div className="mt-10 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <button
            onClick={onScrollToCampaigns}
            className="group px-7 py-3.5 text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>Explore Our Work</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>

          <button
            onClick={onSelectFeatured}
            className="px-6 py-3.5 text-xs uppercase tracking-wider font-semibold text-[#84572f] hover:text-[#141615] bg-[#92ada4]/15 hover:bg-[#92ada4]/25 border border-[#84572f]/20 rounded-full transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Featured Case Study</span>
            <ChevronRight className="w-4 h-4 text-[#84572f]" />
          </button>
        </div>

        {/* Agency Trust & Integrity Indicators */}
        <div className="mt-16 pt-8 border-t border-[#84572f]/10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#92ada4]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#526840]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#141615]">Verified Campaign Data</p>
              <p className="text-xs text-[#1c1c1c]/70 mt-0.5">Strict adherence to verified client outcomes without fabricated vanity metrics.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#f1d5a0]/50 flex items-center justify-center shrink-0 mt-0.5 text-[#84572f]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#141615]">Creator-First Strategy</p>
              <p className="text-xs text-[#1c1c1c]/70 mt-0.5">Partnering with vetted tastemakers and cultural voices for authentic traction.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#84572f]/15 flex items-center justify-center shrink-0 mt-0.5 text-[#84572f]">
              <span className="font-bold text-xs">SD</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#141615]">San Diego Agency Roots</p>
              <p className="text-xs text-[#1c1c1c]/70 mt-0.5">Founded by Taylor and Nick with over two decades of combined social leadership.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
