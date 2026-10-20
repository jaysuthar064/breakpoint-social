import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Film, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { CampaignMediaItem } from '../types/campaign';

interface MediaLightboxProps {
  media: CampaignMediaItem | null;
  onClose: () => void;
  onUpdateMedia?: (updatedMedia: CampaignMediaItem) => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ media, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [media]);

  if (!media) return null;

  // Extract clean reel code if an Instagram URL is present anywhere
  const extractReelCode = (str?: string): string | null => {
    if (!str) return null;
    const match = str.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const detectedCode = extractReelCode(media.videoUrl) || extractReelCode(media.src) || extractReelCode(media.embedUrl) || extractReelCode(media.externalUrl);

  // Resolve direct video asset URL - NEVER fall back to Instagram embed/iframe
  const resolveVideoUrl = (): string => {
    if (media.videoUrl && media.videoUrl.endsWith('.mp4')) {
      return media.videoUrl;
    }
    if (media.src && media.src.endsWith('.mp4')) {
      return media.src;
    }
    if (detectedCode) {
      return `/videos/${detectedCode}.mp4`;
    }
    return media.videoUrl || media.src || '';
  };

  // Resolve direct poster thumbnail URL
  const resolvePosterUrl = (): string => {
    if (media.posterUrl) return media.posterUrl;
    if (media.poster) return media.poster;
    if (detectedCode) return `/thumbnails/${detectedCode}.jpg`;
    return '';
  };

  const videoSrc = resolveVideoUrl();
  const posterSrc = resolvePosterUrl();
  const talentName = media.talent || media.collaborator;
  const descriptionText = media.description || media.caption || 'Mobile-first vertical short-form video deliverable designed to maximize view duration, brand recall, and audience engagement.';
  const formatText = media.format || `${media.aspectRatio || '9:16'} Vertical HD`;

  const isImageDeliverable = media.type === 'image' && (!videoSrc || !videoSrc.endsWith('.mp4'));

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={media.title}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col lg:flex-row bg-[#141615] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors border border-white/15 shadow-xl cursor-pointer"
          aria-label="Close Lightbox"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Frame Viewport — Clean Agency Showcase Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#0a0c0b] relative min-h-[460px] sm:min-h-[580px]">
          {isImageDeliverable ? (
            /* Image Deliverable Viewport */
            <div className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900">
              <img
                src={media.src || posterSrc}
                alt={media.title}
                className="w-full h-auto max-h-[75vh] object-contain mx-auto"
              />
            </div>
          ) : (
            /* Clean 9:16 Vertical Video Showcase (Agency Portfolio Spec) */
            <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex items-center justify-center group">
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                poster={posterSrc}
                className="w-full h-full object-cover rounded-2xl"
                key={videoSrc}
              >
                {videoSrc && <source src={videoSrc} type="video/mp4" />}
                Your browser does not support native video playback.
              </video>
            </div>
          )}
        </div>

        {/* Sidebar Information — Professional Agency Portfolio Details */}
        <div className="w-full lg:w-[410px] p-6 sm:p-7 flex flex-col justify-between bg-[#141615] border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto max-h-[92vh]">
          <div className="space-y-5">
            
            {/* Aspect Ratio & Deliverable Category Badges */}
            <div>
              <div className="flex items-center gap-2 text-[11px] text-[#f1d5a0] uppercase tracking-wider font-semibold font-mono mb-2.5">
                <span className="px-2.5 py-0.5 rounded bg-[#84572f]/30 border border-[#f1d5a0]/30 text-[#f1d5a0]">
                  {media.aspectRatio || '9:16'} RATIO
                </span>
                <span>·</span>
                <span className="text-white/70">CREATIVE DELIVERABLE</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug font-display">
                {media.title}
              </h3>

              {talentName && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90">
                  <Sparkles className="w-3.5 h-3.5 text-[#f1d5a0] shrink-0" />
                  <span className="text-white/60">Talent / Partner:</span>
                  <strong className="text-white font-semibold">{talentName}</strong>
                </div>
              )}
            </div>

            {/* Campaign Performance & Growth Analysis */}
            {media.analytics && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-[#f1d5a0] font-mono flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#f1d5a0]" />
                    <span>Performance &amp; Reach Analysis</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Verified
                  </span>
                </div>

                {/* 2x2 Performance Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider truncate">
                      {media.analytics.viewsContext || 'Views in 30 Days'}
                    </div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">
                      {media.analytics.views}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider truncate">
                      Non-Follower Reach
                    </div>
                    <div className="text-lg font-black text-[#f1d5a0] font-mono mt-0.5">
                      {media.analytics.nonFollowerReach || '85%+'}
                    </div>
                  </div>

                  {media.analytics.interactions && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider truncate">
                        Interactions
                      </div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {media.analytics.interactions}
                      </div>
                    </div>
                  )}

                  {media.analytics.followersGained && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider truncate">
                        Follower Lift
                      </div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {media.analytics.followersGained}
                      </div>
                    </div>
                  )}
                </div>

                {/* Strategic Highlight Banner */}
                <div className="p-3 rounded-xl bg-[#84572f]/20 border border-[#f1d5a0]/30 text-xs">
                  <div className="font-semibold text-[#f1d5a0] flex items-center gap-1.5 mb-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#f1d5a0] shrink-0" />
                    <span>{media.analytics.highlight}</span>
                  </div>
                  {media.analytics.summary && (
                    <p className="text-[11px] text-white/75 leading-relaxed">
                      {media.analytics.summary}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Creative Description */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#f1d5a0] mb-2 font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                <span>Creative Overview</span>
              </h4>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {descriptionText}
              </p>
            </div>

            {/* Deliverable Information */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-white/50 font-mono mb-2">
                Deliverable Information
              </h4>
              
              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/60">Format</span>
                <span className="text-white font-mono">{formatText}</span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/60">Playback Asset</span>
                <span className="text-[#f1d5a0] font-mono flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Native MP4</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/60">Production Standard</span>
                <span className="text-white font-mono">Breakpoint Agency Spec</span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-white/60">Delivery Ratio</span>
                <span className="text-white font-mono">9:16 Vertical</span>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider text-white bg-[#84572f] hover:bg-[#6c4625] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Close Lightbox</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
