import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Film, Sparkles, Layers } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { CAMPAIGN_CATEGORIES } from '../data/campaigns';

interface CampaignShowcaseProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
}

export const CampaignShowcase: React.FC<CampaignShowcaseProps> = ({
  campaigns,
  onSelectCampaign
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Work');

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(item => {
      return selectedCategory === 'All Work' || item.category === selectedCategory;
    });
  }, [campaigns, selectedCategory]);

  return (
    <section id="case-studies" className="py-20 md:py-28 bg-[#fcf5e9] border-b border-[#84572f]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#84572f]">
                AGENCY CASE STUDIES
              </span>
              <span className="text-xs text-[#1c1c1c]/50 font-normal">·</span>
              <span className="text-xs text-[#84572f] font-semibold bg-[#f1d5a0]/40 px-2.5 py-0.5 rounded-full">
                Selected Client Work
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#141615] tracking-tight font-display">
              Work That Speaks for Itself
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#1c1c1c]/80 leading-relaxed">
              A curated collection of client campaigns, creative video productions, and brand strategy work developed by Breakpoint Social.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mb-10 pb-6 border-b border-[#84572f]/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {CAMPAIGN_CATEGORIES.map(category => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4.5 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#84572f] text-white shadow-xs'
                      : 'bg-[#92ada4]/15 text-[#1c1c1c]/80 hover:bg-[#92ada4]/25 hover:text-[#1c1c1c]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campaign Editorial Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-[#f6f8f5] rounded-2xl border border-[#84572f]/10">
            <p className="text-sm font-semibold text-[#141615]">No campaigns found matching this filter.</p>
            <button
              onClick={() => setSelectedCategory('All Work')}
              className="mt-3 text-xs text-[#84572f] font-semibold underline hover:no-underline"
            >
              Reset Category Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((item, index) => {
              const isLarge = index === 0;

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectCampaign(item)}
                  className={`group relative flex flex-col bg-[#f6f8f5] rounded-2xl overflow-hidden border border-[#84572f]/15 hover:border-[#84572f]/40 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
                    isLarge ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  {/* Media Container with proper framing */}
                  <div className={`relative w-full overflow-hidden bg-[#141615] ${
                    isLarge ? 'aspect-[16/9] sm:aspect-[21/9]' : 'aspect-[16/10]'
                  }`}>
                    
                    {/* Clean Frame for Campaign Preview */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1c1e1d] to-[#121312] flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#92ada4]/15 border border-[#92ada4]/30 flex items-center justify-center text-[#92ada4] mb-3 group-hover:scale-105 transition-transform">
                        {item.category === 'Creative Production' ? (
                          <Film className="w-5 h-5 text-[#92ada4]" />
                        ) : item.category === 'Social Media Management' ? (
                          <Sparkles className="w-5 h-5 text-[#f1d5a0]" />
                        ) : (
                          <Layers className="w-5 h-5 text-[#84572f]" />
                        )}
                      </div>

                      <p className="text-xs uppercase font-mono tracking-wider text-[#f1d5a0]">
                        {item.brand}
                      </p>

                      <h3 className="mt-1 text-sm sm:text-base font-bold text-white max-w-md line-clamp-2 px-4">
                        {item.title}
                      </h3>

                      {item.collaboratorNames && item.collaboratorNames.length > 0 && (
                        <p className="mt-1.5 text-xs text-white/70">
                          Ft. {item.collaboratorNames.join(', ')}
                        </p>
                      )}

                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-[#f1d5a0]">
                        <span>Verified Case Study</span>
                      </div>
                    </div>

                    {/* Top badging */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-black/80 text-[#f1d5a0] backdrop-blur-xs border border-white/10">
                        {item.category}
                      </span>

                      {item.isFeatured && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#84572f] text-white shadow-xs">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#84572f] font-semibold mb-2">
                        <span>{item.brand}</span>
                        <span aria-hidden="true" className="text-[#1c1c1c]/30">·</span>
                        <span className="text-[#1c1c1c]/60 font-normal">{item.category}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#141615] group-hover:text-[#84572f] transition-colors leading-snug">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-[#1c1c1c]/75 leading-relaxed line-clamp-2">
                        {item.shortDescription}
                      </p>

                      <div className="mt-4 pt-3 border-t border-[#84572f]/10">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#1c1c1c]/50 mb-1.5">
                          Services Delivered
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#1c1c1c]/70">
                          {item.servicesProvided.slice(0, 3).map((srv, idx) => (
                            <span key={idx}>
                              {srv}{idx < Math.min(item.servicesProvided.length, 3) - 1 ? ' ·' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#84572f]/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#84572f] group-hover:underline flex items-center gap-1">
                        <span>View Case Study Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>

                      <span className="text-[11px] text-[#1c1c1c]/50 font-mono">
                        {item.mediaGallery.length} {item.mediaGallery.length === 1 ? 'Deliverable' : 'Deliverables'}
                      </span>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
