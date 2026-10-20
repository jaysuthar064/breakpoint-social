import React from 'react';
import { Mail, Phone, MapPin, ArrowRight, MessageSquare } from 'lucide-react';

import { HOME_DEFAULTS } from '../content.js';

interface FinalCTAProps {
  onOpenContact: () => void;
  content?: any;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenContact, content = HOME_DEFAULTS.cta }) => {
  const cards = content.cards ?? [];
  const secondary = content.secondary_cta ?? {};
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-[#141615] text-white">
      {/* Decorative ambient gradients */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#84572f]/25 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#92ada4]/15 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Eyebrow */}
        <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#f1d5a0] mb-4">
          {content.eyebrow}
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-balance leading-tight">
          {content.heading} <br />
          <span className="text-[#f1d5a0] font-script text-4xl sm:text-6xl lg:text-7xl lowercase">
            {content.heading_script}
          </span>
        </h2>

        {/* Description */}
        <p className="mt-6 text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          {content.subtext}
        </p>

        {/* Action Button */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenContact}
            className="w-full sm:w-auto px-8 py-4 text-xs uppercase tracking-wider font-bold text-[#141615] bg-[#f1d5a0] hover:bg-[#ffe5b8] rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>{content.primary_label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={secondary.url || '/contact-us/'}
            className="w-full sm:w-auto px-7 py-4 text-xs uppercase tracking-wider font-semibold text-white/90 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-all flex items-center justify-center gap-2"
          >
            <span>{secondary.label || 'Visit Contact Page'}</span>
          </a>
        </div>

        {/* Direct Contact Cards */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          
          {cards.map((card: any, idx: number) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#f1d5a0]/40 transition-colors"
            >
              <p className="text-xs uppercase tracking-wider text-[#f1d5a0] font-semibold mb-1">
                {card.name}
              </p>
              <p className="text-sm font-medium text-white mb-2">
                {card.role}
              </p>

              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="text-xs text-neutral-300 hover:text-[#f1d5a0] flex items-center gap-2 py-0.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#92ada4]" />
                  <span>{card.email}</span>
                </a>
              )}

              {card.phone && (
                <a
                  href={`tel:${String(card.phone).replace(/[^+0-9]/g, '')}`}
                  className="text-xs text-neutral-300 hover:text-[#f1d5a0] flex items-center gap-2 py-0.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#92ada4]" />
                  <span>{card.phone}</span>
                </a>
              )}

              {card.note && (
                <div className="text-xs text-neutral-300 flex items-center gap-2 py-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#92ada4]" />
                  <span>{card.note}</span>
                </div>
              )}

              {card.footnote && (
                <p className="text-[11px] text-neutral-400 mt-2">
                  {card.footnote}
                </p>
              )}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};
