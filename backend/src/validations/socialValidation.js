import Joi from 'joi';
import { REPORT_REASONS } from '../models/ContentReport.js';

export const createCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
  }),
  parentComment: Joi.string().trim().hex().length(24).allow(null).optional(),
});

export const updateCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
  }),
});

export const voteSchema = Joi.object({
  value: Joi.number().valid(1, -1).required().messages({
    'any.only': 'Vote value must be 1 (upvote) or -1 (downvote)',
  }),
});

export const reportSchema = Joi.object({
  reason: Joi.string()
    .valid(...REPORT_REASONS)
    .required()
    .messages({
      'any.only': `Reason must be one of: ${REPORT_REASONS.join(', ')}`,
      'string.empty': 'Report reason is required',
    }),
  details: Joi.string().trim().max(1000).allow('').optional(),
});

export const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters',
  }),
});

export const createConversationSchema = Joi.object({
  recipientId: Joi.string().trim().hex().length(24).required().messages({
    'string.empty': 'Recipient ID is required',
    'string.length': 'Invalid recipient ID format',
  }),
  initialMessage: Joi.string().trim().max(2000).allow('').optional(),
});
