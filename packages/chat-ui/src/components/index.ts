// Phase 5: full implementations. Stubs compile clean until then.
export { ChatBox } from './chat/ChatBox';
export { ChatBar } from './chat/ChatBar';
export { ChatBubbles } from './chat/ChatBubbles';
export { ChatHeader } from './chat/ChatHeader';
export { ChatList } from './chat/ChatList';
export type { ChatListProps } from './chat/ChatList';
export { ChatListTabs } from './chat/ChatListTabs';
export { ChatPerson } from './chat/ChatPerson';
export type { ChatPersonProps } from './chat/ChatPerson';
export { Avatar } from './chat/Avatar';
export type { AvatarProps } from './chat/Avatar';
export { MediaRenderer } from './chat-variations/MediaRenderer';
export type { ChatBubblesProps } from './chat/ChatBubbles';

// Message rendering (polymorphic router + bubble variations)
export { RenderMessage } from './messages/RenderMessage';
export type { RenderMessageProps } from './messages/RenderMessage';
export { MessageBubble } from './messages/MessageBubble';
export { BubbleTime } from './messages/BubbleTime';
export { TextBubble } from './messages/bubbles/TextBubble';
export { MediaAttachment } from './messages/bubbles/MediaAttachment';
export { SentTip } from './messages/bubbles/SentTip';
