export type ConversationType = 'DIRECT' | 'AI';
export type SenderType = 'USER' | 'AI';
export type AttachmentType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'FILE';

export type ChatUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  avatarURL: string | null;
  hasSeenWelcome: boolean;
  locale: 'es' | 'en';
  googleId: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId: string | null;
  content: string | null;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
  createdAt: string;
  readAt: string | null;
};

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  otherUser: ChatUser | null;
  lastMessage: Message | null;
};

export type ContactSummary = {
  id: string;
  contactSince: string;
  user: ChatUser;
};

export type ContactRequest = {
  id: string;
  requestedAt: string;
  user: ChatUser;
};

export type NotificationType =
  'CONTACT_REQUEST' | 'CONTACT_ACCEPTED' | 'CONTACT_REJECTED';

export type AppNotification = {
  id: string;
  type: NotificationType;
  actor: ChatUser | null;
  contactId: string | null;
  readAt: string | null;
  createdAt: string;
};
