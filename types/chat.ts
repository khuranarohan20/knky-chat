import type { Media } from "./media";

export interface MessageInterface {
  _id: string;
  messageId: string;
  channel_id: string;
  sender_id: string;
  message: string;
  url: string;
  og_msg: string;
  name: string;
  meta: MetaInterface;
  sid?: string;
  message_deleted_by: string[];
  reactions: any[];
  createdAt: string;
  updatedAt: string;
  message_id?: string;
  display_name?: string;
}

export interface ChatFeeInterface {
  _id: string;
  user: string;
  is_active: boolean;
  type: "Minute" | "Hour" | "Day" | "Month" | "PerMessage" | "OneOff";
  price: number;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface BuyerInterface {
  buyer: string;
  bought_at: string;
  expires_at: string;
  service_id: Serviceid;
}

interface Serviceid {
  _id: string;
  user: string;
  type: string;
  chat_fee_type: "Minute" | "Hour" | "Day" | "Month" | "PerMessage" | "OneOff";
  is_active: boolean;
  price: number;
}

interface MetaInterface {
  type:
    | "ACCEPT_CALL"
    | "RATING"
    | "VIDEO"
    | "VOICE"
    | "message"
    | "direct-message"
    | "auto-message"
    | "chat-unlock"
    | "message-attachment"
    | "stream"
    | "story-reply"
    | "SENT-TIP"
    | "CUSTOM-SERVICE"
    | "SET-PRICE"
    | "EMBEDS"
    | "MASS-MESSAGE";
  sub_type?: "POST" | "PRODUCT" | "CHANNEL" | "GROUP";
  subtype?: "VIDEO" | "VOICE" | "RATING" | "CUSTOM-SERVICE" | "";
  requestAccept?: true | false | "sent";
  entity_id?: string;
  media?: Media | Media[];
  token?: string;
  story_id?: string;
  expiry_date?: string;
  author?: string;
  amount?: number | string;
  reqId: string;
  forward?: boolean;
  paid?: boolean;
  serviceData?: GetServiceResponse;
  hasSetPrice?: boolean;
  partial_accept?: boolean;
  has_discount?: boolean;
  discount?: {
    discount_type: "percentage" | "amount";
    discount_value: number;
  };
  request_note?: string;
  custom_info?: string;
  serviceId?: string;
  ratingType?: string;
  counter_offer_price?: number;
  counter_status?: "pending" | "accepted" | "rejected";
  counter_offer_accepted?: boolean;
  free_service?: boolean;
  details?: string;
  rateText?: string;
  is_flexible?: boolean;
  counter_description?: string;
  stars?: number;
  offered_amount?: number;
  duration?: number;
  price?: number;
  is_unlocked?: boolean;
  converseId?: string;
  avatar?: Media[];
  name: string;
  id?: string;
  story_data?: StoryMedia;
  media_fee: number;
  request_icon?: Media[];
  replyMessage?: MessageInterface;
  is_audio?: boolean;
  paid_by?: string;
  buyers?: BuyerInterface;
  transaction_id?: string;
  displayName?: string;
  isCompleted?: boolean;
  url?: string;
  address: AddressMetaInterface;
  delete_for?: string;
  title?: string;
  chat_list_message?: string;
  entity_type?: "channel" | "collab";
  channel_name?: string;
  channel_id?: string;
  tag_name?: string;
  subscription_type?: string;
}
interface AddressMetaInterface {
  transaction_id: string;
  _id?: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface LatestChatFee {
  _id: string;
  user: string;
  is_active: boolean;
  type: "Minute" | "Hour" | "Day" | "Month" | "PerMessage" | "OneOff";
  price: number;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface ChatPerson {
  _id: string;
  display_name: string;
  avatar: Media[];
  username: string;
  user_type: string;
  badges: any;
  latest_chat_fee: LatestChatFee;
  chat_fee_services: ChatFeeResponse[];
}

export interface Chat {
  _id: string;
  target: ChatPerson;
  initiator: ChatPerson;
  converse_channel_id: string;
  unread_count: number;
  message: MessageInterface;
  lastmessage: string | { message: string };
  is_subscriber?: boolean;
  is_subscribed?: boolean;
  is_following?: boolean;
  is_matched?: boolean;
  package?: {
    type: keyof typeof SubscriptionPlans;
  };
  buyers: BuyerInterface[];
  payment_reminder: boolean;
  complete_messages: MessageInterface[];
  converse_consumable: {
    buyer: string;
    available_message: number;
    _id: string;
  }[];
}

export interface ChatFeeResponse {
  _id: string;
  user: string;
  type: string;
  name: string;
  chat_fee_type: ChatFeeType;
  note: string;
  avatar: any[];
  is_active: boolean;
  price: number;
  fixed_price: boolean;
  has_discount: boolean;
  is_deleted: boolean;
  is_default: boolean;
  created_at: string;
  includes?: string;
  discount?: {
    discount_value: number;
    discount_type: "percentage" | "amount";
    expires_on: string;
  };
}

export enum ChatFeeType {
  ONE_OFF = "OneOff",
  MINUTE = "Minute",
  DAY = "Day",
  HOUR = "Hour",
  WEEK = "Week",
  MONTH = "Month",
  PER_MESSAGE = "PerMessage",
  FREE = "Free",
}

export const SubscriptionPlans: Record<string, string> = {
  HALF_YEARLY: "6 Months",
  QUARTERLY: "3 Months",
  MONTHLY: "1 Month",
  YEARLY: "1 Year",
};

export interface GetServiceResponse {
  _id?: string;
  user: Author;
  type: string;
  name: string;
  includes: string;
  media: File;
  note: string;
  is_default: boolean;
  is_active: boolean;
  price: number;
  avatar: Media[];
  min_price: number;
  service_type: string;
  chat_fee_type: string;
  has_discount: boolean;
  modified?: boolean;
  is_deleted: boolean;
  fixed_price: boolean;
  discount: {
    discount_value: number;
    discount_type: "percentage" | "amount";
    expires_on: string;
  };
  created_at: string;
  available_message?: number;
  duration: number;
}
export interface Author {
  f_name?: string;
  l_name?: string;
  avatar?: Media[];
  _id: string;
  background?: Media[];
  username: string;
  badges?: BadgesType;
  pic: string;
  role: string;
  user_type?: string;
  has_active_services?: boolean;
  display_name: string;
  follows_you?: boolean;
  followed_by_you?: boolean;
  account_status?: string;
  counter?: {
    post_count: number;
  };
  min_subscription?: MinSubscription;
}

export interface BadgesType {
  user_badges: UserBadge[];
  subscription_badge: SubscriptionBadge[];
}

export type UserBadge =
  | "AffiliatedWithKnky"
  // | "VerifiedByKnky"
  | "VerifiedCreator"
  | "VerifiedUser";

export type SubscriptionBadge = "CreatorPro" | "Prime";

export type FirstBadgePriority =
  | "CreatorPro"
  | "VerifiedCreator"
  | "VerifiedUser";
export type SecondBadgePriority = "AffiliatedWithKnky" | "Prime";

export interface MinSubscription {
  _id: string;
  price: number;
  author: string;
  channel: string;
}

export interface StoryMedia {
  _id: string;
  visibility: string;
  hashtags: any[];
  type: string;
  post_id: PostMedia;
  product: SellItem;
  media: Media[];
  pay_and_watch_rate: number;
  backgroundColor?: string;
  media_categories: string[];
  earning: number;
  is_deleted: boolean;
  is_purchased: boolean;
  is_liked: boolean;
  has_prime: boolean;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface PostMedia {
  _id: string;
  caption: string;
  media: Media[];
  preview: Media[];
  visibility: PostType;
  has_prime: boolean;
  is_purchased: boolean;
  textColor: string;
  backgroundColor: string;
}

export type PostType =
  | "Public"
  | "Premium"
  | "Prime"
  | "OnlyMe"
  | "Subscription";

export interface SellItem {
  created_at?: string | number | Date;
  _id: string;
  name: string;
  brand: string;
  category: string;
  custom_category?: string;
  description: string;
  media_categories: string[];
  variations: {
    colors: string[];
    sizes: string[];
  };
  price: number;
  media: Media[];
  quantity: number;
  sold?: number;
  sell_type: string;
  end_date: string;
  bid?: Bid;
  ts: number;
  author: Author;
  is_public: boolean;
}
export interface Bid {
  reservedBid: number;
  timeLeft: number;
  lastBid: number;
}
