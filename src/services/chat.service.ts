import mongoose from 'mongoose';
import { Conversation, Message } from '../models/chat.model';
import User from '../models/user.model';
import { emitConversationUpdateToUsers, emitMessageToUsers } from '../realtime/chat.gateway';

const ensureUsersAreFriends = async (userId: string, friendId: string) => {
  const user = await User.findById(userId).select('friends');
  if (!user) {
    throw new Error('User not found');
  }

  const isFriend = user.friends.some((id) => id.toString() === friendId);
  if (!isFriend) {
    throw new Error('Chat is available only between friends');
  }
};

const getOrCreateConversation = async (userId: string, friendId: string) => {
  const participantIds = [userId, friendId]
    .map((id) => new mongoose.Types.ObjectId(id))
    .sort((a, b) => a.toString().localeCompare(b.toString()));

  let conversation = await Conversation.findOne({
    participants: { $all: participantIds, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: participantIds,
    });
  }

  return conversation;
};

export const listFriendPresence = async (userId: string) => {
  const user = await User.findById(userId).select('friends');
  if (!user) {
    throw new Error('User not found');
  }

  const friends = await User.find({ _id: { $in: user.friends } })
    .select('_id username email image isOnline lastSeenAt')
    .sort({ username: 1 });

  return friends.map((friend) => ({
    _id: friend._id,
    username: friend.username,
    email: friend.email,
    image: friend.image,
    isOnline: friend.isOnline,
    lastSeenAt: friend.lastSeenAt || null,
  }));
};

export const listConversations = async (userId: string) => {
  const conversations = await Conversation.find({
    participants: new mongoose.Types.ObjectId(userId),
  })
    .populate({
      path: 'participants',
      select: '_id username image isOnline lastSeenAt',
    })
    .sort({ updatedAt: -1 });

  return conversations.map((conversation) => {
    const participants = conversation.participants as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      username: string;
      image?: string;
      isOnline: boolean;
      lastSeenAt?: Date;
    }>;

    const peer = participants.find((p) => p._id.toString() !== userId);

    return {
      _id: conversation._id,
      peer: peer
        ? {
          _id: peer._id,
          username: peer.username,
          image: peer.image,
          isOnline: peer.isOnline,
          lastSeenAt: peer.lastSeenAt || null,
        }
        : null,
      lastMessage: conversation.lastMessage || null,
      updatedAt: conversation.updatedAt,
    };
  });
};

export const getConversationWithFriend = async (userId: string, friendId: string) => {
  await ensureUsersAreFriends(userId, friendId);
  return await getOrCreateConversation(userId, friendId);
};

export const listMessagesWithFriend = async (userId: string, friendId: string, limit = 50) => {
  await ensureUsersAreFriends(userId, friendId);
  const conversation = await getOrCreateConversation(userId, friendId);

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('sender', '_id username image')
    .populate('receiver', '_id username image');

  return {
    conversationId: conversation._id,
    messages: messages.reverse(),
  };
};

export const sendMessageToFriend = async (userId: string, friendId: string, content: string) => {
  const trimmedContent = content?.trim();
  if (!trimmedContent) {
    throw new Error('Message content is required');
  }

  await ensureUsersAreFriends(userId, friendId);
  const conversation = await getOrCreateConversation(userId, friendId);

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    receiver: friendId,
    content: trimmedContent,
  });

  const now = message.createdAt;
  conversation.lastMessage = {
    sender: new mongoose.Types.ObjectId(userId),
    content: trimmedContent,
    createdAt: now,
  };
  await conversation.save();

  const hydratedMessage = await Message.findById(message._id)
    .populate('sender', '_id username image')
    .populate('receiver', '_id username image');

  const messagePayload = {
    conversationId: conversation._id,
    message: hydratedMessage,
  };

  const conversationPayload = {
    _id: conversation._id,
    lastMessage: conversation.lastMessage,
    updatedAt: conversation.updatedAt,
  };

  emitMessageToUsers([userId, friendId], messagePayload);
  emitConversationUpdateToUsers([userId, friendId], conversationPayload);

  return messagePayload;
};
