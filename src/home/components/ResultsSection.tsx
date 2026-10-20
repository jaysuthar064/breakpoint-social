import React from 'react';
import { Eye, Users, PlayCircle, HeartHandshake, Globe, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface ResultsSectionProps {
  onOpenContact: () => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ onOpenContact }) => {
  const stats = [
    {
      value: '1.3M+',
      label: 'ORGANIC VIEWS',
      context: 'in 30 days',
      icon: Eye,
      accent: 'from-[#f1d5a0]/30 to-[#84572f]/20',
      badge: 'Total Reach'
    },
    {
      value: '+631',
      label: 'NEW FOLLOWERS',
      context: 'in 30 days',
      icon: Users,
      accent: 'from-[#92ada4]/30 to-[#526840]/20',
      badge: 'Audience Growth'
    },
    {
      value: '139K+',
      label: 'CONTENT VIEWS',
      context: 'in 30 days',
      icon: PlayCircle,
      accent: 'from-[#f1d5a0]/30 to-[#84572f]/20',
      badge: 'Consistent Volume'
    },
    {
      value: '12K+',
      label: 'INTERACTIONS',
      context: 'in 30 days',
      icon: HeartHandshake,
      accent: 'from-[#92ada4]/30 to-[#526840]/20',
      badge: 'High Engagement'
    },
    {
      value: '89%',
      label: 'NON-FOLLOWER VIEWS',
      context: 'reaching new audiences',
      icon: Globe,
      accent: 'from-[#f1d5a0]/30 to-[#84572f]/20',
      badge: 'Organic Discovery'
    },
    {
      value: '57K+',
      label: 'VIEWS',
      context: 'on a single piece of content',
      icon: Zap,
      accent: 'from-[#84572f]/40 to-[#f1d5a0]/20',
      badge: 'Viral Spike'
    }
  ];

  return (
    <section id="results" className="py-20 md:py-28 bg-[#0e100f] text-white border-b border-white/10 relative overflow-hidden">
      {/* Subtle background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84572f]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#92ada4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[#f1d5a0]/30 text-[#f1d5a0] text-xs font-mono font-semibold tracking-wider uppercase mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#f1d5a0]" />
            <span>VERIFIED PERFORMANCE DATA</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-display">
            RESULTS THAT SPEAK FOR THEMSELVES
          </h2>

          <p className="mt-4 text-xl sm:text-2xl font-medium text-[#f1d5a0] font-body tracking-wide">
            Real Content. Real Reach. Real Growth.
          </p>

          <p className="mt-2 text-sm sm:text-base text-white/70 max-w-xl mx-auto">
            Selected results generated across Breakpoint Social client accounts.
          </p>
        </div>

        {/* 6 Metric Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={idx}
                className="group relative bg-[#181a19] rounded-2xl p-7 border border-white/10 hover:border-[#f1d5a0]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#84572f]/10 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle top glow border gradient */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${stat.accent}`} />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-[#f1d5a0] bg-white/5 border border-white/10">
                      {stat.badge}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70 group-hover:text-[#f1d5a0] group-hover:bg-white/10 transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display group-hover:text-[#f1d5a0] transition-colors">
                    {stat.value}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/90 font-mono">
                    {stat.label}
                  </div>
                  <div className="text-xs text-white/60 font-body mt-0.5">
                    {stat.context}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout & Value Proposition Card */}
        <div className="relative bg-gradient-to-br from-[#1c1e1d] to-[#141615] rounded-3xl p-8 sm:p-12 border border-[#84572f]/40 shadow-2xl overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#84572f]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                We build content that gets brands noticed.
              </h3>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed font-body">
                From social strategy and content creation to influencer marketing, Breakpoint Social helps brands reach new audiences, build awareness, and turn attention into growth.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={onOpenContact}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#84572f] hover:bg-[#6c4625] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#f1d5a0]/30"
              >
                <span>SEE WHAT BREAKPOINT CAN DO FOR YOUR BRAND</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
