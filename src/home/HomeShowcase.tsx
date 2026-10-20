/**
 * The homepage, ported from the senior's React app (github.com/vipul9987/Breakpoint).
 *
 * The body of this component is his, unchanged -- only the declaration was
 * renamed from `App` to `HomeShowcase` so it can mount as a route here rather
 * than as the root of its own app. Every class, string and structure below is
 * copied verbatim, because the brief was that the homepage match his exactly.
 *
 * It carries its own header, footer and announcement bar, so App.jsx renders it
 * without the site chrome. It also reads no CMS content, which means the
 * homepage still renders when the WordPress API is unreachable.
 */
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedCampaign } from './components/FeaturedCampaign';
import { InstagramReelsGrid } from './components/InstagramReelsGrid';
import { CampaignShowcase } from './components/CampaignShowcase';
import { ResultsSection } from './components/ResultsSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { MediaLightbox } from './components/MediaLightbox';
import { CampaignDetailModal } from './components/CampaignDetailModal';
import { ContactModal } from './components/ContactModal';
import { INITIAL_CAMPAIGNS } from './data/campaigns';
import { Campaign, CampaignMediaItem } from './types/campaign';

export function HomeShowcase() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  
  // Modals state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<CampaignMediaItem | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Featured campaign
  const featuredCampaign = campaigns.find(c => c.isFeatured) || campaigns[0];

  const handleScrollToCampaigns = () => {
    const el = document.getElementById('case-studies');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectFeatured = () => {
    const el = document.getElementById('featured-campaign');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateMediaItem = (updatedMedia: CampaignMediaItem) => {
    setCampaigns(prev => prev.map(c => {
      const idx = c.mediaGallery.findIndex(m => m.id === updatedMedia.id);
      if (idx !== -1) {
        const newGallery = [...c.mediaGallery];
        newGallery[idx] = updatedMedia;
        return { ...c, mediaGallery: newGallery };
      }
      return c;
    }));
    if (lightboxMedia?.id === updatedMedia.id) {
      setLightboxMedia(updatedMedia);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf5e9] text-[#1c1c1c] flex flex-col font-body selection:bg-[#92ada4] selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-[#84572f] text-white text-[11px] py-1.5 px-4 text-center tracking-wider uppercase font-semibold flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f1d5a0] animate-pulse" />
        <span>Breakpoint Social · San Diego Social Media Agency — Client Case Studies &amp; Campaign Showcase</span>
      </div>

      {/* Main Header */}
      <Header onOpenContact={() => setIsContactOpen(true)} />

      <main className="flex-1">
        {/* Section 01: Hero */}
        <Hero 
          onScrollToCampaigns={handleScrollToCampaigns}
          onSelectFeatured={handleSelectFeatured}
        />

        {/* Section 02: Featured Campaign (Lo Lo Estrin Fe with Serena Pitt) */}
        <FeaturedCampaign
          campaign={featuredCampaign}
          onOpenLightbox={(media) => setLightboxMedia(media)}
          onViewFullCaseStudy={(camp) => setSelectedCampaign(camp)}
          onUpdateMediaItem={handleUpdateMediaItem}
        />

        {/* Section 03: Verified Client Results & Performance Metrics */}
        <ResultsSection onOpenContact={() => setIsContactOpen(true)} />

        {/* Section 04: Dedicated Instagram Reels Showcase Grid */}
        <InstagramReelsGrid
          onOpenLightbox={(media) => setLightboxMedia(media)}
        />

        {/* Section 04: Campaign Showcase & Additional Case Studies */}
        <CampaignShowcase
          campaigns={campaigns}
          onSelectCampaign={(camp) => setSelectedCampaign(camp)}
        />

        {/* Section 05: Final CTA */}
        <FinalCTA onOpenContact={() => setIsContactOpen(true)} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Deep Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        allCampaigns={campaigns}
        onClose={() => setSelectedCampaign(null)}
        onOpenLightbox={(media) => setLightboxMedia(media)}
        onSelectCampaign={(camp) => setSelectedCampaign(camp)}
      />

      {/* Contact Inquiry Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        prefilledCampaign={selectedCampaign?.brand}
      />

      {/* Media Lightbox (Topmost Modal Overlay) */}
      <MediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        onUpdateMedia={handleUpdateMediaItem}
      />
    </div>
  );
}
