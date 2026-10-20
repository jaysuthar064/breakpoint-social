import React, { useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, ExternalLink, Play } from 'lucide-react';
import { Campaign, CampaignMediaItem } from '../types/campaign';

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onOpenLightbox: (media: CampaignMediaItem) => void;
  onSelectCampaign: (campaign: Campaign) => void;
  allCampaigns: Campaign[];
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  campaign,
  onClose,
  onOpenLightbox,
  onSelectCampaign,
  allCampaigns
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!campaign) return null;

  const currentIndex = allCampaigns.findIndex(c => c.id === campaign.id);
  const prevCampaign = currentIndex > 0 ? allCampaigns[currentIndex - 1] : null;
  const nextCampaign = currentIndex < allCampaigns.length - 1 ? allCampaigns[currentIndex + 1] : null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-2 sm:p-6 lg:p-10 flex justify-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
    >
      <div 
        className="relative w-full max-w-5xl bg-[#fcf5e9] rounded-2xl md:rounded-3xl shadow-2xl border border-[#84572f]/20 overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#fcf5e9]/95 backdrop-blur-md border-b border-[#84572f]/15">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#84572f]">
            <span>{campaign.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1c1c1c]/60 font-normal">{campaign.category}</span>
            {campaign.driveAssetRef && (
              <span className="bg-[#f1d5a0]/50 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                {campaign.driveAssetRef}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#84572f]/10 text-[#141615] transition-colors"
              aria-label="Close Case Study"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-12">
          
          {/* Header & Hero Title */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#84572f]">
                CASE STUDY
              </span>
              <span className="text-xs text-[#1c1c1c]/40 font-normal">/</span>
              <span className="text-xs text-[#1c1c1c]/70">{campaign.category}</span>
            </div>

            <h1 id="campaign-modal-title" className="text-3xl sm:text-5xl font-extrabold text-[#141615] tracking-tight font-display">
              {campaign.title}
            </h1>

            {campaign.collaboratorNames && campaign.collaboratorNames.length > 0 && (
              <p className="mt-2 text-lg sm:text-xl text-[#84572f] font-medium flex items-center gap-2">
                <span>Featuring</span>
                <span className="font-semibold underline decoration-[#f1d5a0] decoration-2 underline-offset-4">
                  {campaign.collaboratorNames.join(', ')}
                </span>
              </p>
            )}

            <p className="mt-6 text-base sm:text-lg text-[#1c1c1c]/80 leading-relaxed max-w-3xl">
              {campaign.fullDescription}
            </p>
          </div>

          {/* Strategic Approach Two-Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#84572f]/15">
            {campaign.objective && (
              <div className="bg-[#f6f8f5] p-6 rounded-2xl border border-[#84572f]/10">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#84572f] mb-2">
                  Campaign Objective
                </h3>
                <p className="text-sm text-[#1c1c1c]/80 leading-relaxed">
                  {campaign.objective}
                </p>
              </div>
            )}

            {campaign.creativeApproach && (
              <div className="bg-[#f6f8f5] p-6 rounded-2xl border border-[#84572f]/10">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#84572f] mb-2">
                  Creative Approach
                </h3>
                <p className="text-sm text-[#1c1c1c]/80 leading-relaxed">
                  {campaign.creativeApproach}
                </p>
              </div>
            )}
          </div>

          {/* Deliverables / Services */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#84572f] mb-3">
              Services Delivered
            </h3>
            <div className="flex flex-wrap gap-2">
              {campaign.servicesProvided.map((service, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#92ada4]/15 border border-[#84572f]/15 text-[#141615]"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Creative Deliverables & Media Showcase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#141615] font-display">
                Creative Showcase
              </h3>
              <span className="text-xs text-[#84572f] font-medium">
                Click any preview to expand
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {campaign.mediaGallery.map((media) => {
                const isDrive = media.type === 'drive' || Boolean(media.embedUrl && media.embedUrl.includes('drive.google.com'));
                const isInstagram = media.type === 'instagram' || Boolean(media.embedUrl && media.embedUrl.includes('instagram.com'));
                const isVideo = media.type === 'video' || Boolean(media.src && (media.src.includes('.mp4') || media.src.includes('.webm')));

                return (
                  <div
                    key={media.id}
                    onClick={() => onOpenLightbox(media)}
                    className="group relative bg-[#141615] rounded-xl overflow-hidden cursor-pointer border border-[#84572f]/20 hover:border-[#84572f]/60 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className={`relative w-full ${media.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'} bg-[#1e201f] overflow-hidden flex flex-col items-center justify-center text-center`}>
                      {isDrive || isInstagram ? (
                        <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                          {media.poster || media.posterUrl ? (
                            <img
                              src={media.poster || media.posterUrl}
                              alt={media.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                              <Play className="w-8 h-8 text-[#f1d5a0]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#84572f]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/20">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : isVideo && media.src ? (
                        <>
                          <video
                            src={media.src}
                            poster={media.poster}
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#84572f]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : media.type === 'image' && media.src ? (
                        <img
                          src={media.src}
                          alt={media.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="p-4 flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#84572f]/30 border border-[#f1d5a0]/40 flex items-center justify-center text-[#f1d5a0] mb-2 group-hover:scale-110 transition-transform">
                            {media.exampleNumber ? (
                              <span className="font-bold text-xs">0{media.exampleNumber}</span>
                            ) : (
                              <Sparkles className="w-4 h-4 text-[#f1d5a0]" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-2 px-2">
                            {media.title}
                          </p>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/70 text-[#f1d5a0] backdrop-blur-xs">
                        {media.aspectRatio} {media.type.toUpperCase()}
                      </div>
                    </div>

                    <div className="p-3 bg-[#fcf5e9] border-t border-[#84572f]/10 text-xs">
                      <p className="font-semibold text-[#141615] line-clamp-1">{media.title}</p>
                      <p className="text-[11px] text-[#84572f] font-medium mt-0.5 flex items-center justify-between">
                        <span>Click to view &amp; play</span>
                        <span>&rarr;</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Section (Strictly complying with Content Accuracy Rule #9 & #11) */}
          <div className="pt-8 border-t border-[#84572f]/15">
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#84572f] mb-3">
              Campaign Performance &amp; Results
            </h3>

            {campaign.metrics && campaign.metrics.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {campaign.metrics.map((metric, idx) => (
                  <div key={idx} className="p-4 bg-[#f6f8f5] rounded-xl border border-[#84572f]/10">
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#84572f] font-mono tabular-nums">
                      {metric.value}
                    </p>
                    <p className="text-xs font-semibold text-[#141615] mt-1">{metric.label}</p>
                    {metric.context && (
                      <p className="text-[11px] text-[#1c1c1c]/60 mt-0.5">{metric.context}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#f6f8f5] border border-dashed border-[#84572f]/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#84572f] shrink-0 mt-0.5" />
                <div className="text-xs text-[#1c1c1c]/80 space-y-1">
                  <p className="font-semibold text-[#141615]">
                    Metrics Awaiting Client Approval &amp; Final Audit
                  </p>
                  <p>
                    Breakpoint Social policy strictly prohibits fabricating engagement numbers, vanity impressions, or conversion metrics. 
                    Verified analytics for {campaign.brand} will be published once officially finalized by the brand partner and Taylor.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer with Previous / Next Switchers */}
        <div className="sticky bottom-0 z-30 px-6 py-4 bg-[#fcf5e9] border-t border-[#84572f]/15 flex items-center justify-between">
          <div>
            {prevCampaign ? (
              <button
                onClick={() => onSelectCampaign(prevCampaign)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#84572f] hover:text-[#141615] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev: {prevCampaign.brand}</span>
                <span className="sm:hidden">Prev</span>
              </button>
            ) : <div />}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full transition-colors"
          >
            Back to All Work
          </button>

          <div>
            {nextCampaign ? (
              <button
                onClick={() => onSelectCampaign(nextCampaign)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#84572f] hover:text-[#141615] transition-colors"
              >
                <span className="hidden sm:inline">Next: {nextCampaign.brand}</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>
        </div>

      </div>
    </div>
  );
};
