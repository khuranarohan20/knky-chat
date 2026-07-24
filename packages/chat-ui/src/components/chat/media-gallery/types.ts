import type { Author, Media, MetaInterface } from '@knky-chat/core-chat';

// The shared-content API returns loosely-typed rows; we narrow only the fields
// the gallery actually renders. Extra fields flow through via the index sig.
export interface SharedMediaItem {
  _id: string;
  path?: string;
  type: string;
  status?: string;
  variations: string[];
  used_as?: string;
  poster?: string;
  resolution?: { width: number; height: number };
  duration?: string;
  signed_urls?: Record<string, string>;
  author: string;
  is_unlocked?: boolean;
  media_fee: number;
  converse_message_id: string;
  converse_message_created_at: string;
  total_media_count_ref_message_id?: number;
  message_data: {
    temporary_message_id: string;
    message_creation_time: string;
    meta: MetaInterface;
  };
  [key: string]: any;
}

export interface ApiPost {
  created_at: string;
  converse_message_created_at: string;
  converse_message_id: string;
  post: {
    media: Media[];
    author: Author;
    created_at?: string;
  };
  [key: string]: any;
}

export interface ServiceItem {
  target_user: string;
  is_promotion?: boolean;
  converse_message_id: string;
  converse_message_created_at: string;
  media?: Media[];
  message_data: { meta?: MetaInterface; [key: string]: any };
  [key: string]: any;
}

export interface GroupedSubscriptionEntry {
  media: Media[];
  author: Author;
  tag_name: string;
  avatar: Media[];
  counter: { media_count?: { image_count?: number; video_count?: number } };
  channel_name: string;
  perks: any[];
  is_subscribed: boolean;
  my_subscription_data: any;
  expires_on?: string;
  converse_message_created_at: string;
  converse_message_id: string;
  min_subscription: any;
  _id: string;
}

export interface GroupedServiceEntry {
  service: ServiceItem;
  avatar: Media[];
  meta: MetaInterface;
}
