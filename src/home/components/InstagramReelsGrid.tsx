import React, { useState } from 'react';
import { Play, Film, TrendingUp, BarChart3 } from 'lucide-react';
import { INSTAGRAM_REELS_LIST, InstagramReelItem } from '../data/campaigns';
import { CampaignMediaItem } from '../types/campaign';

interface InstagramReelsGridProps {
  onOpenLightbox: (media: CampaignMediaItem) => void;
}

export const InstagramReelsGrid: React.FC<InstagramReelsGridProps> = ({ onOpenLightbox }) => {
  const [filter, setFilter] = useState<string>('All Work');

  const categories = ['All Work', 'Creative Production', 'Social Media Management', 'Brand Development & Positioning', 'Event Marketing'];

  const filteredReels = filter === 'All Work'
    ? INSTAGRAM_REELS_LIST
    : INSTAGRAM_REELS_LIST.filter(r => r.category === filter);

  const handleOpenMedia = (reel: InstagramReelItem) => {
    const mediaItem: CampaignMediaItem = {
      id: reel.id,
      type: 'video',
      title: reel.title,
      aspectRatio: reel.aspectRatio,
      poster: reel.posterUrl || reel.coverImage,
      posterUrl: reel.posterUrl || reel.coverImage,
      videoUrl: reel.videoUrl,
      src: reel.videoUrl,
      talent: reel.talent,
      format: reel.format,
      description: reel.description,
      caption: reel.description,
      analytics: reel.analytics
    };
    onOpenLightbox(mediaItem);
  };

  return (
    <section id="instagram-reels-showcase" className="py-20 md:py-28 bg-[#141615] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f1d5a0] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#f1d5a0]">
                CREATIVE VIDEO DELIVERABLES
              </span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/80 font-mono bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                {INSTAGRAM_REELS_LIST.length} Video Deliverables
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Short-Form Video Product Showcase
            </h2>

            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed">
              Explore {INSTAGRAM_REELS_LIST.length} vertical short-form video deliverables created and produced by Breakpoint Social. Click any deliverable for instant playback.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="my-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#84572f] text-white shadow-sm border border-[#f1d5a0]/40'
                    : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                }`}
              >
                {cat} {cat === 'All Work' ? `(${INSTAGRAM_REELS_LIST.length})` : ''}
              </button>
            );
          })}
        </div>

        {/* 16 Pure Video Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredReels.map((reel, idx) => (
            <div
              key={reel.id}
              onClick={() => handleOpenMedia(reel)}
              className="group relative bg-[#1c1e1d] rounded-2xl border border-white/10 hover:border-[#f1d5a0]/60 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
            >
              {/* 9:16 High-Aesthetic Cover Image Viewport */}
              <div className="relative w-full aspect-[9/16] bg-neutral-900 overflow-hidden">
                <img
                  src={reel.coverImage}
                  alt={reel.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Dark Vignette & Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 group-hover:via-black/20 transition-colors" />

                {/* Top Header Badge Row */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/80 text-[#f1d5a0] backdrop-blur-md border border-white/15">
                    DELIVERABLE 0{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/80 bg-black/60 backdrop-blur-xs">
                    9:16 HD
                  </span>
                </div>

                {/* Deliverable Performance Analytics Badges */}
                {reel.analytics && (
                  <div className="absolute top-11 left-3.5 right-3.5 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-black/85 text-[#f1d5a0] backdrop-blur-md border border-[#f1d5a0]/30 shadow-md flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#f1d5a0]" />
                      <span>{reel.analytics.views}</span>
                    </span>
                    {reel.analytics.nonFollowerReach && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-medium font-mono bg-black/85 text-emerald-300 backdrop-blur-md border border-emerald-500/30 shadow-md">
                        {reel.analytics.nonFollowerReach} Discovery
                      </span>
                    )}
                  </div>
                )}

                {/* Center Glowing Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-[#84572f]/90 group-hover:bg-[#84572f] text-white flex items-center justify-center shadow-2xl border border-white/20 transition-transform duration-300 group-hover:scale-110">
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Overlay Text */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#f1d5a0] font-mono mb-1">
                    <Film className="w-3 h-3" />
                    <span>Creative Reel Deliverable</span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
                    {reel.title}
                  </h3>
                </div>
              </div>

              {/* Deliverable Analytics Highlight */}
              {reel.analytics && (
                <div className="px-3.5 py-2 bg-[#121413] border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-[#f1d5a0] font-mono font-semibold flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-[#f1d5a0]" />
                    <span>{reel.analytics.views} views</span>
                  </span>
                  <span className="text-white/60 text-[10px] truncate max-w-[150px] font-medium" title={reel.analytics.highlight}>
                    {reel.analytics.highlight}
                  </span>
                </div>
              )}

              {/* Card Footer */}
              <div className="p-3.5 bg-[#181a19] border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span className="text-[11px] text-[#f1d5a0] font-semibold group-hover:underline flex items-center gap-1">
                  <span>Play Video</span>
                  <span>&rarr;</span>
                </span>
                <span className="text-[10px] text-white/50 font-mono">{reel.category}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
