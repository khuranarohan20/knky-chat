// Phase 5: full implementations. Stubs compile clean until then.
export { ChatBox } from './chat/ChatBox';
export { ChatBar } from './chat/ChatBar';
export { ChatBubbles } from './chat/ChatBubbles';
export { ChatHeader } from './chat/ChatHeader';
export { ChatList } from './chat/ChatList';
export type { ChatListProps } from './chat/ChatList';
export { ChatListFilters } from './chat/ChatListFilters';
export type { ChatListFiltersProps } from './chat/ChatListFilters';
export { ChatListTabs } from './chat/ChatListTabs';
export { ChatPerson } from './chat/ChatPerson';
export type { ChatPersonProps } from './chat/ChatPerson';
export { ChatStats } from './chat/ChatStats';
export type { ChatStatsProps } from './chat/ChatStats';
export { MediaGallery } from './chat/media-gallery';
export type { MediaGalleryProps } from './chat/media-gallery';
export { AllCreatorsListing } from './chat/AllCreatorsListing';
export type { AllCreatorsListingProps } from './chat/AllCreatorsListing';
export { ChatFeeBanner } from './chat/ChatFeeBanner';
export type { ChatFeeBannerProps } from './chat/ChatFeeBanner';
export { PinnedMessages } from './chat/PinnedMessages';
export type { PinnedMessagesProps } from './chat/PinnedMessages';
export { Avatar } from './chat/Avatar';
export type { AvatarProps } from './chat/Avatar';
export { MediaRenderer } from './chat-variations/MediaRenderer';

// Shared primitives
export { Icon } from './common/Icon';
export type { IconProps, IconFolder, IconType } from './common/Icon';

// Loading skeletons
export { ChatBubbleShimmer } from './shimmers/ChatBubbleShimmer';
export { ChatListShimmer } from './shimmers/ChatListShimmer';
export { ChatPersonShimmer } from './shimmers/ChatPersonShimmer';
export type { ChatBubblesProps } from './chat/ChatBubbles';

// Message rendering (polymorphic router + bubble variations)
export { RenderMessage } from './messages/RenderMessage';
export type { RenderMessageProps } from './messages/RenderMessage';
export { MessageBubble } from './messages/MessageBubble';
export { BubbleTime } from './messages/BubbleTime';
export { TextBubble } from './messages/bubbles/TextBubble';
export { MediaAttachment } from './messages/bubbles/MediaAttachment';
export { SentTip } from './messages/bubbles/SentTip';
export { InfoBubble } from './messages/bubbles/InfoBubble';
export {
  VideoVoiceBubble,
  RatingRequest,
  CustomRequest,
  JoinCallBtn,
  NewPayment,
  RequestTip,
  ChatUnlock,
  StoryReply,
  SetPrice,
  TagApproval,
} from './messages/bubbles/service-bubbles';
export { ChatEmbeds } from './messages/bubbles/ChatEmbeds';
export { Promotion } from './messages/bubbles/Promotion';
