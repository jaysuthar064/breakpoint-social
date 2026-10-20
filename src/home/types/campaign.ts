export type CampaignCategory = 
  | 'Creative Production'
  | 'Social Media Management'
  | 'Brand Development & Positioning'
  | 'Event Marketing';

export type PublicationStatus = 'published' | 'draft' | 'client_review';

export interface DeliverableAnalytics {
  views: string;
  viewsContext?: string;
  nonFollowerReach?: string;
  interactions?: string;
  followersGained?: string;
  highlight?: string;
  summary?: string;
}

export interface CampaignMediaItem {
  id: string;
  type: 'video' | 'image' | 'placeholder' | 'drive' | 'instagram';
  title: string;
  aspectRatio: '9:16' | '16:9' | '4:5' | '1:1' | '4:3';
  src?: string;
  videoUrl?: string;
  posterUrl?: string;
  talent?: string;
  format?: string;
  description?: string;
  analytics?: DeliverableAnalytics;
  embedUrl?: string;
  externalUrl?: string;
  poster?: string;
  caption?: string;
  collaborator?: string;
  exampleNumber?: 1 | 2 | 3 | 4;
  isPlaceholder?: boolean;
  placeholderReason?: string;
}

export interface CampaignMetric {
  label: string;
  value: string;
  context?: string;
  isVerified: boolean;
}

export interface Campaign {
  id: string;
  brand: string;
  title: string;
  category: CampaignCategory;
  isFeatured?: boolean;
  collaboratorNames?: string[];
  shortDescription: string;
  fullDescription: string;
  objective?: string;
  creativeApproach?: string;
  servicesProvided: string[];
  mediaGallery: CampaignMediaItem[];
  thumbnail: {
    type: 'video' | 'image' | 'placeholder';
    aspectRatio: '9:16' | '16:9' | '4:3' | '1:1' | '4:5';
    src?: string;
    caption?: string;
    isPlaceholder?: boolean;
    placeholderLabel?: string;
  };
  metrics?: CampaignMetric[];
  publicationStatus: PublicationStatus;
  displayOrder: number;
  driveAssetRef?: string; // e.g. "Asset 01", "Asset 02", "Asset 03"
  clientNotes?: string;
  dateCreated?: string;
}
