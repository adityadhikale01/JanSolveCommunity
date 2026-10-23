import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name avatar location')
      .lean();

    // Calculate unread count per conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadMessagesCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          readAt: null,
        });

        // Other participant
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        return {
          ...conv,
          otherParticipant,
          unreadCount: unreadMessagesCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { recipientId, initialMessage } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a conversation with yourself',
        code: 'INVALID_RECIPIENT',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        lastMessageText: initialMessage ? initialMessage.slice(0, 100) : '',
        lastMessageAt: new Date(),
        lastSender: req.user._id,
      });

      if (initialMessage && initialMessage.trim()) {
        await Message.create({
          conversation: conversation._id,
          sender: req.user._id,
          body: initialMessage.trim(),
        });
      }
    }

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name avatar location'
    );

    return res.status(201).json({
      success: true,
      data: {
        conversation: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation',
        code: 'FORBIDDEN',
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { body } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation',
        code: 'FORBIDDEN',
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      body: body.trim(),
    });

    // Update conversation metadata
    conversation.lastMessageAt = new Date();
    conversation.lastMessageText = body.trim().slice(0, 100);
    conversation.lastSender = req.user._id;
    await conversation.save();

    // Notify other participant
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    if (otherParticipantId) {
      await Notification.create({
        recipient: otherParticipantId,
        actor: req.user._id,
        type: 'new_message',
        entityType: 'conversation',
        entityId: conversation._id,
        message: `New message from ${req.user.name}: "${body.trim().slice(0, 60)}"`,
      });
    }

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    return res.status(201).json({
      success: true,
      data: {
        message: populatedMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        code: 'FORBIDDEN',
      });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};
